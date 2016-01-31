'use strict'

const randomBytes = require('crypto').randomBytes
const fortune = require('fortune')
const chalk = require('chalk')
const settings = require('./settings')
const log = require('./log')
const postgresAdapter = require('fortune-postgres')

// Serializers.
const htmlSerializer = require('./serializers/html')
const cssSerializer = require('./serializers/css')
const jsSerializer = require('./serializers/js')
const faviconSerializer = require('./serializers/favicon')
const formDataSerializer = require('./serializers/form-data')
const imageSerializers = require('./serializers/image')
const pngSerializer = imageSerializers.pngSerializer
const webpSerializer = imageSerializers.webpSerializer
const jpegSerializer = imageSerializers.jpegSerializer
const gifSerializer = imageSerializers.gifSerializer
const formUrlEncodedSerializer = fortune.serializers.formUrlEncoded

// Record types.
const ImageObject = require('./types/image_object')
const Thing = require('./types/thing')
const Comment = require('./types/comment')
const recordTypes = {}
const transforms = {}

for (let type of [ ImageObject, Thing, Comment ]) {
  recordTypes[type.name] = type.definition
  transforms[type.name] = {
    input: type.input,
    output: type.output
  }
}

const store = fortune(recordTypes, {
  adapter: {
    type: postgresAdapter,
    options: {
      url: settings.databaseUrl,
      generatePrimaryKey: () =>
        `${Date.now()}_${randomBytes(2).toString('hex')}`,
      isNative: true
    }
  },
  serializers: [
    { type: htmlSerializer },
    { type: cssSerializer },
    { type: jsSerializer },
    { type: pngSerializer },
    { type: webpSerializer },
    { type: jpegSerializer },
    { type: gifSerializer },
    { type: faviconSerializer },
    { type: formUrlEncodedSerializer },
    { type: formDataSerializer }
  ],
  transforms
})

// Inject dependency.
ImageObject.adapter = store.adapter

module.exports = store

// Try to delete up to 50 IDs which have no images associated to them every
// 8 hours.
setInterval(() => {
  store.adapter.find('Thing', null, {
    fields: { appearsIn: true },
    sort: { appearsIn: true },
    limit: 50
  })
  .then(records => {
    const deleteIDs = []

    for (let record of records)
      if (!record.appearsIn.length)
        deleteIDs.push(record.id)

    return store.adapter.delete('Thing', deleteIDs)
  })
  .then(number => {
    if (number) log(chalk.yellow(`Deleted ${chalk.bold(number)} ` +
      `ID${number !== 1 ? 's' : ''}!`))
  })
}, 8 * 60 * 60 * 1000)
