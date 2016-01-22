const browserify = require('browserify')
const path = require('path')
const staticSerializer = require('./static')


const source = path.join(__dirname, '../../assets/javascripts/index.js')


module.exports = staticSerializer('text/javascript', new Promise(resolve => {
  const chunks = []
  const bundle = browserify(source)
    .transform({ global: true }, 'uglifyify')
    .bundle()

  bundle.on('data', chunk => chunks.push(chunk))
  bundle.on('end', () => resolve(Buffer.concat(chunks).toString()))
}))
