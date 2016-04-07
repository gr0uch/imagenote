const url = require('url')
const fortune = require('fortune')

const HttpSerializer = fortune.net.http.Serializer
const imageType = 'ImageObject'
const cacheControl = 'max-age=31536000, public'

function imageSerializer (mediaType) {
  function ImageSerializer () {
    HttpSerializer.apply(this, arguments)
  }

  ImageSerializer.mediaType = mediaType

  ImageSerializer.prototype = Object.assign(
  Object.create(HttpSerializer.prototype), {

    processRequest (contextRequest, request) {
      const parts = url.parse(request.url).pathname.slice(1).split('/')
      const ids = [ decodeURIComponent(parts[1]) ]

      contextRequest.options = {}
      request.meta = {}

      return this.adapter.find(imageType, ids, {
        fields: { thumbnailCrc32: true, imageCrc32: true }
      })

      .then(result => {
        const record = result[0]
        const crc32 = record.thumbnailCrc32 || record.imageCrc32

        if (contextRequest.meta.headers['if-none-match'] === crc32) {
          request.meta.skip = true
          throw contextRequest
        }
        else {
          contextRequest.isThumbnail = request.meta.isThumbnail =
            parts[0] === 't'
          contextRequest.source = 'image'
          contextRequest.remoteAddress = request.remoteAddress
          contextRequest.type = imageType
          contextRequest.ids = ids
          contextRequest.options.fields = {
            imageData: true, thumbnailData: true,
            viewers: true, mimeType: true
          }
          request.meta.crc32 = crc32
        }

        return contextRequest
      })
    },

    processResponse (contextResponse, request, response) {
      if (request.meta.skip) {
        response.statusCode = 304
        delete contextResponse.payload
        return contextResponse
      }

      const record = contextResponse.payload.records[0]
      const isThumbnail = request.meta.isThumbnail &&
        record.thumbnailData

      contextResponse.payload = isThumbnail ?
        record.thumbnailData : record.imageData

      if (!('headers' in contextResponse.meta))
        contextResponse.meta.headers = {}

      contextResponse.meta.headers['Content-Type'] = record.mimeType
      contextResponse.meta.headers['ETag'] = request.meta.crc32
      contextResponse.meta.headers['Cache-Control'] = cacheControl

      return contextResponse
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
