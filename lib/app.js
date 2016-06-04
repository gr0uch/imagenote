'use strict'

const fortune = require('fortune')
const http = require('http')
const chalk = require('chalk')
const log = require('./log')
const store = require('./store')

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

const imageRoute = /\/[it]\//

const listener = fortune.net.http(store, {
  serializers: [
    [ htmlSerializer ],
    [ cssSerializer ],
    [ jsSerializer ],
    [ pngSerializer ],
    [ webpSerializer ],
    [ jpegSerializer ],
    [ gifSerializer ],
    [ faviconSerializer ],
    [ formUrlEncodedSerializer ],
    [ formDataSerializer ]
  ]
})

const server = http.createServer((request, response) => {
  // Ignore garbage requests.
  if (request.headers['content-type'] === 'application/octet-stream' ||
    request.url.indexOf('/index.php') === 0) {
    response.statusCode = 400
    return response.end()
  }
  const remoteAddress = request.remoteAddress =
    request.headers['x-forwarded-for'] || request.connection.remoteAddress
  const start = Date.now()

  // Serve binary image data from these routes.
  if (imageRoute.test(request.url.slice(0, 3)))
    request.headers['accept'] = 'image/*'

  // Static routes.
  if (request.url === '/stylesheet')
    request.headers['accept'] = 'text/css'
  if (request.url === '/script')
    request.headers['accept'] = 'text/javascript'
  if (request.url === '/favicon.ico')
    request.headers['accept'] = 'image/x-icon'

  return listener(request, response)
  .then(result => {
    if (result.payload)
      log(chalk.grey([
        chalk.green(chalk.bold(response.statusCode)),
        chalk.green(`[ ${chalk.bold(request.url)} ]`),
        `(${Date.now() - start} ms)`,
        `(${remoteAddress})`
      ].join(' ')))
  })
  .catch(error => {
    if (!(error instanceof Error) && response.statusCode < 400) {
      log(chalk.grey([
        chalk.green(chalk.bold(response.statusCode)),
        chalk.green(`[ ${chalk.bold(request.url)} ]`),
        `(${Date.now() - start} ms)`,
        `(${remoteAddress})`
      ].join(' ')))
      return
    }
    log(chalk.grey([
      chalk.bold(chalk.red(response.statusCode)),
      chalk.red(`[ ${chalk.bold(request.url)} ]`),
      `(${Date.now() - start} ms)`,
      `(${remoteAddress})`
    ].join(' ')))
    log(chalk.grey(error.stack || error))
  })
})

module.exports = { store, server }
