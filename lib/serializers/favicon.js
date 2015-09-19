const fs = require('fs')
const path = require('path')
const staticSerializer = require('./static')

const source = path.join(__dirname, '../../assets/images/favicon.ico')
const payload = fs.readFileSync(source)

module.exports = staticSerializer('image/x-icon', Promise.resolve(payload))
