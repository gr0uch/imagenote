'use strict'

const fortune = require('fortune')
const crc = require('crc')

const Serializer = fortune.Serializer

module.exports = (id, promise) => {
  let payload
  let crc32

  promise.then(result => {
    payload = result
    crc32 = crc.crc32(payload).toString(16)
  })

  function StaticSerializer () {
    Serializer.apply(this, arguments)
  }

  StaticSerializer.prototype = Object.assign(
  Object.create(Serializer.prototype), {

    processRequest (context, request, response) {
      if (!payload) throw new Error(`Asset is missing.`)

      if (request.headers['if-none-match'] === crc32) {
        response.statusCode = 304
        context.request.skip = true
      }

      return context
    },

    showResponse (context) {
      const skip = context.request.skip
      const response = context.response

      if (!skip) {
        response.meta['ETag'] = crc32
        response.payload = payload
      }

      return context
    }

  })

  StaticSerializer.id = id

  return StaticSerializer
}
