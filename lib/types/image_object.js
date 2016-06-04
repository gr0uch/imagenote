'use strict'

const deepEqual = require('deep-equal')
const inflection = require('inflection')
const chalk = require('chalk')
const gm = require('gm')
const imageSize = require('image-size')
const crc32 = require('fast-crc32c')
const math = require('mathjs')
const fortune = require('fortune')
const log = require('../log')
const settings = require('../settings')

const calculate = crc32.calculate
const createMethod = fortune.methods.create
const updateMethod = fortune.methods.update
const ForbiddenError = fortune.errors.ForbiddenError
const BadRequestError = fortune.errors.BadRequestError
const ConflictError = fortune.errors.ConflictError

const mimeMap = {
  JPEG: 'image/jpeg',
  PNG: 'image/png',
  GIF: 'image/gif',
  WEBP: 'image/webp'
}

const recordType = {

  // We expect this to be injected.
  adapter: null,

  name: 'ImageObject',

  definition: {
    name: { type: String },
    about: { link: 'Thing', inverse: 'appearsIn', isArray: true },
    comment: { link: 'Comment', inverse: 'about', isArray: true },
    uploadDate: { type: Date },
    description: { type: String },
    keywords: { type: String, isArray: true },
    mimeType: { type: String },
    image: { type: String },
    imageData: { type: Buffer },
    imageCrc32: { type: String },
    blankData: { type: Buffer },
    uploadTarget: { type: Buffer, isArray: true },
    thumbnailUrl: { type: String },
    thumbnailData: { type: Buffer },
    thumbnailCrc32: { type: String },
    width: { type: Number },
    height: { type: Number },
    megapixel: { type: Number },
    viewers: { type: String, isArray: true },
    history: { type: Object, isArray: true }
  },

  input (context, record, update) {
    const method = context.request.method
    const remoteAddress = context.request.remoteAddress
    const thumbnailWidth = settings.thumbnailWidth
    const minimumWidth = settings.minimumWidth
    const minimumHeight = settings.minimumHeight

    if (method === createMethod) {
      const start = Date.now()
      let format
      let gcd
      record.uploadDate = new Date()
      record.viewers = [ remoteAddress ]
      record.imageCrc32 = calculate(record.imageData).toString(16)

      // Can't set these fields.
      delete record.id
      delete record.image
      delete record.thumbnailUrl
      delete record.uploadTarget

      if ('keywords' in record)
        record.keywords = assignKeywords(record.keywords)

      // Validations.
      if (record.description &&
      record.description.length > settings.maxDescriptionLength)
        throw new BadRequestError('Description is too long, ' +
          `maximum of ${settings.maxDescriptionLength} characters.`)
      if (record.imageData.length / Math.pow(1024, 2) > settings.maxFileSize)
        throw new BadRequestError('Image file size is too big, ' +
          `maximum of ${settings.maxFileSize} MB.`)

      // Assign initial history.
      record.history = [ { replace: {
        description: record.description,
        keywords: record.keywords,
        about: record.about
      } } ]

      return recordType.adapter.find('ImageObject', null, {
        match: { imageCrc32: record.imageCrc32 },
        fields: { imageCrc32: true }
      })
      .then(result => {
        if (result.length)
          throw new ConflictError('Duplicate image. Original image is ' +
            `<a href="/i/${encodeURIComponent(result[0].id)}">here</a>.`)

        return 'about' in record ? assignAbout(record.about) : []
      })

      .then(ids => {
        record.about = ids
      })

      .then(() => new Promise((resolve, reject) =>
        // Get image data.
        gm(record.imageData)
        .format((error, result) => {
          if (error) return reject(error)
          if (!(result in mimeMap)) return reject(new BadRequestError(
            'The image is not of an allowed file type.'))

          format = result
          record.mimeType = mimeMap[format]

          // GraphicsMagick/ImageMagick doesn't reliably get the image
          // dimensions!
          let size

          try { size = imageSize(record.imageData) }
          catch (error) { return reject(error) }

          record.width = size.width
          record.height = size.height
          record.megapixel = size.width * size.height / Math.pow(10, 6)
          gcd = math.gcd(record.width, record.height)

          if (record.width < minimumWidth || record.height < minimumHeight)
            return reject(new BadRequestError('An image is too small, it ' +
              `must be at least ${minimumWidth} x ${minimumHeight} pixels.`))

          return resolve()
        })))
      .then(() => new Promise((resolve, reject) =>
        gm(record.width / gcd, record.height / gcd, '#ffffffff')
        .toBuffer('GIF', (error, buffer) => {
          if (error) return reject(error)
          record.blankData = buffer
          return resolve(record)
        })))
      .then(() => record.width > thumbnailWidth ?
        new Promise((resolve, reject) => {
          // Generate thumbnail image if needed.
          let m = gm

          // Need to use ImageMagick for animated GIFs, since GraphicsMagick
          // has some bugs.
          if (format === 'GIF') m = m.subClass({ imageMagick: true })

          const thumbnail = m(record.imageData)

          if (format === 'GIF') thumbnail.coalesce()
          else thumbnail.interlace('Line')

          thumbnail.quality(85)
          .resize(thumbnailWidth)
          .toBuffer(format, (error, buffer) => {
            if (error) return reject(error)
            record.thumbnailData = buffer
            record.thumbnailCrc32 = calculate(buffer).toString(16)
            return resolve(record)
          })
        }) : record)
      .then(record => {
        log(
          chalk.magenta('Image processing took ' +
          `${chalk.bold(Date.now() - start)} ms!`))

        return record
      })
    }

    if (method === updateMethod) {
      if (update.push || update.pull)
        throw new ForbiddenError('Invalid update.')

      return ('about' in update.replace ?
        assignAbout(update.replace.about) : Promise.resolve([]))
      .then(ids => {
        const id = update.id
        const description = update.replace.description
        const keywords = assignKeywords(update.replace.keywords)
        const history = { replace: {} }

        if (!deepEqual(ids, record.about))
          history.replace.about = ids
        if (!deepEqual(keywords, record.keywords))
          history.replace.keywords = keywords
        if (description !== record.description)
          history.replace.description = description

        if (description &&
        description.length > settings.maxDescriptionLength)
          throw new BadRequestError('Description is too long, ' +
            `maximum of ${settings.maxDescriptionLength} characters.`)

        return Object.assign({ id }, history, { push: { history } })
      })
    }

    return null
  },

  output (context, record) {
    const method = context.request.method
    const type = context.request.type
    const remoteAddress = context.request.remoteAddress
    const id = record.id
    const viewers = record.viewers

    // Append computed fields.
    const encodedId = encodeURIComponent(record.id)
    record.image = `/i/${encodedId}`
    record.thumbnailUrl = `/t/${encodedId}`

    // Delete non-standard fields.
    delete record.viewers
    delete record.uploadTarget
    delete record.history

    if (context.request.source !== 'image') {
      delete record.mimeType
      delete record.imageData
      delete record.thumbnailData
    }

    const addView = !viewers.some(ip => ip === remoteAddress)
    record.viewCount = viewers.length
    if (!addView) record.viewCount--

    if (method === createMethod || context.request.isThumbnail)
      return record

    return (addView ?
      recordType.adapter.update(type, [ {
        id, push: { viewers: remoteAddress }
      } ]) : Promise.resolve())
    .then(() => record)
  }

}


function assignKeywords (keywords) {
  keywords = new Set(keywords.map(x =>
    x.trim().toLowerCase()).filter(x => x))

  for (let keyword of keywords)
    if (keyword.length > settings.maxTagLength)
      throw new BadRequestError('A tag is too long, ' +
        `maximum of ${settings.maxTagLength} characters.`)

  return Array.from(keywords)
}


function assignAbout (ids) {
  ids = ids.map(x =>
    x.trim().toLowerCase()).filter(x => x)

  for (let id of ids)
    if (id.length > settings.maxTagLength)
      throw new BadRequestError('An ID is too long, ' +
        `maximum of ${settings.maxTagLength} characters.`)

  return recordType.adapter.find('Thing', ids)
  .then(records => {
    const missingIDs = ids.filter(id =>
      !records.some(record => record.id === id))

    return recordType.adapter.create('Thing', missingIDs.map(id => ({
      id, name: [ inflection.titleize(id) ]
    })))

    // Ignore when creation fails, it may be intended when multiple images
    // are uploaded at the same time with the same identifier.
    .catch(() => null)
  })
  .then(() => ids)
}


module.exports = recordType
