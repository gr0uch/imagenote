'use strict'

const fortune = require('fortune')
const http = require('http')
const chalk = require('chalk')
const log = require('./log')
const store = require('./store')

// Record types.
const ImageObject = require('./types/image_object')
const Thing = require('./types/thing')

for (let type of new Set([
  ImageObject, Thing
])) {
  store.defineType(type.name, type.definition)
  if (type.input) store.transformInput(type.input)
  if (type.output) store.transformOutput(type.output)
}


const imageRoute = /\/[it]\//

const listener = fortune.net.http(store)
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
