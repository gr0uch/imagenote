const postcss = require('postcss')
const atImport = require('postcss-import')
const cssnext = require('postcss-cssnext')
const cssnano = require('cssnano')
const fs = require('fs')
const path = require('path')
const staticSerializer = require('./static')

const source = path.join(__dirname, '../../assets/stylesheets/index.css')

const payload = postcss([ atImport, cssnext, cssnano() ])
  .process(fs.readFileSync(source, 'utf8'), { from: source })
  .then(result => result.css)

module.exports = staticSerializer('text/css', payload)
