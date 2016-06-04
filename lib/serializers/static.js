'use strict'

const fortune = require('fortune')
const crc32 = require('fast-crc32c')
const chalk = require('chalk')
const log = require('../log')

const calculate = crc32.calculate
const HttpSerializer = fortune.net.http.Serializer

module.exports = (mediaType, promise) => {
  let payload
  let crc32

  promise.then(result => {
    payload = result
    crc32 = calculate(payload).toString(16)
  }, error => {
    log(chalk.red(error))
  })

  function StaticSerializer () {
    HttpSerializer.apply(this, arguments)
  }

  StaticSerializer.prototype = Object.assign(
  Object.create(HttpSerializer.prototype), {

    processRequest (contextRequest, request, response) {
      if (!payload) throw new Error('Asset is missing.')

      if (request.headers['if-none-match'] === crc32) {
        response.statusCode = 304
        request.skip = true
        throw contextRequest
      }

      const output = { meta: { headers: {} }, payload }
      response.statusCode = 200
      throw output
    },

    processResponse (contextResponse, request) {
      const skip = request.skip

      if (skip) delete contextResponse.payload
      else contextResponse.meta.headers['ETag'] = crc32

      return contextResponse
    }

  })

  StaticSerializer.mediaType = mediaType

  return StaticSerializer
}
