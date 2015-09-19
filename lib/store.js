const randomBytes = require('crypto').randomBytes
const fortune = require('fortune')
const settings = require('./settings')
const postgresAdapter = require('fortune-postgres')

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


module.exports = fortune.create({
  adapter: {
    type: postgresAdapter,
    options: {
      url: settings.databaseUrl,
      generatePrimaryKey: () =>
        `${Date.now()}_${randomBytes(2).toString('hex')}`,
      isNative: true
    }
  },
  serializers: [
    { type: htmlSerializer },
    { type: cssSerializer },
    { type: jsSerializer },
    { type: pngSerializer },
    { type: webpSerializer },
    { type: jpegSerializer },
    { type: gifSerializer },
    { type: faviconSerializer },
    { type: formUrlEncodedSerializer },
    { type: formDataSerializer }
  ]
})
