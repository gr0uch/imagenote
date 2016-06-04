const fortune = require('fortune')

const HttpSerializer = fortune.net.http.Serializer
const className = 'FormDataSerializer'
const FormDataSerializer = fortune.net.http[className](HttpSerializer)

function CustomFormDataSerializer () {
  FormDataSerializer.apply(this, arguments)
}

Object.assign(CustomFormDataSerializer, FormDataSerializer)

CustomFormDataSerializer.prototype = Object.assign(
  Object.create(FormDataSerializer.prototype), {

    parsePayload (contextRequest) {
      const methods = this.methods
      const type = contextRequest.type
      const method = contextRequest.method

      return FormDataSerializer.prototype
        .parsePayload.call(this, contextRequest)
      .then(payload => {
        if (type === 'ImageObject') {
          if (method === methods.create) {
            const image = payload[0]

            return image.uploadTarget.map(buffer => ({
              name: image.name || null,
              description: image.description || null,
              about: 'about' in image && image.about.length ?
                image.about[0].split(',').filter(x => x) : [],
              keywords: 'keywords' in image && image.keywords.length ?
                image.keywords[0].split(',').filter(x => x) : [],
              imageData: buffer
            }))
          }
          else if (method === methods.update) {
            const replace = payload[0].replace

            replace.name = replace.name || null
            replace.description = replace.description || null
            replace.about = replace.about && replace.about.length ?
                replace.about[0].split(',').filter(x => x) : []
            replace.keywords = replace.keywords && replace.keywords.length ?
                replace.keywords[0].split(',').filter(x => x) : []

            return payload
          }

          throw new Error('Something went wrong.')
        }

        return payload
      })
    }

  })

module.exports = CustomFormDataSerializer
