const url = require('url')
const fortune = require('fortune')

const Serializer = fortune.Serializer
const imageType = 'ImageObject'
const cacheControl = 'max-age=31536000, public'

function imageSerializer (id) {
  function ImageSerializer () {
    Serializer.apply(this, arguments)
  }

  ImageSerializer.id = id

  ImageSerializer.prototype = Object.assign(
  Object.create(Serializer.prototype), {

    processRequest (context, request) {
      const parts = url.parse(request.url).pathname.slice(1).split('/')
      const ids = [ decodeURIComponent(parts[1]) ]

      context.response.meta.headers = {}

      return this.adapter.find(imageType, ids, {
        fields: { thumbnailCrc32: true, imageCrc32: true }
      })

      .then(result => {
        const record = result[0]
        const crc32 = record.thumbnailCrc32 || record.imageCrc32

        if (context.request.meta.headers['if-none-match'] === crc32)
          context.response.skip = true
        else {
          if (parts[0] === 't') context.request.isThumbnail = true
          context.request.source = 'image'
          context.request.remoteAddress = request.remoteAddress
          context.request.type = imageType
          context.request.ids = ids
          context.request.options.fields = {
            imageData: true, thumbnailData: true,
            viewers: true, mimeType: true
          }
          context.response.crc32 = crc32
        }

        return context
      })
    },

    processResponse (context, request, response) {
      if (context.response.skip)
        response.statusCode = 304

      return context
    },

    showResponse (context, records) {
      if (context.response.skip) return context

      const record = records[0]
      const isThumbnail = context.request.isThumbnail &&
        record.thumbnailData

      context.response.payload = isThumbnail ?
        record.thumbnailData : record.imageData

      context.response.meta.headers['Content-Type'] = record.mimeType
      context.response.meta.headers['ETag'] = context.response.crc32
      context.response.meta.headers['Cache-Control'] = cacheControl

      return context
    }

  })

  return ImageSerializer
}

module.exports = {
  pngSerializer: imageSerializer('image/png'),
  webpSerializer: imageSerializer('image/webp'),
  jpegSerializer: imageSerializer('image/jpeg'),
  gifSerializer: imageSerializer('image/gif')
}
