const cssnext = require('cssnext')
const fs = require('fs')
const path = require('path')
const staticSerializer = require('./static')

const source = path.join(__dirname, '../../assets/stylesheets/index.css')
const payload = cssnext(fs.readFileSync(source, 'utf8'), {
  from: source, compress: true
})

module.exports = staticSerializer('text/css', Promise.resolve(payload))
