const fortune = require('fortune')

const Serializer = fortune.Serializer
const formData = fortune.serializers.formData
const FormDataSerializer = formData(Serializer)

function CustomFormDataSerializer () {
  FormDataSerializer.apply(this, arguments)
}

Object.assign(CustomFormDataSerializer, FormDataSerializer)

CustomFormDataSerializer.prototype = Object.assign(
  Object.create(FormDataSerializer.prototype), {

    parseCreate (context) {
      const type = context.request.type

      if (!context.request.isUpdate)
        if (type === 'ImageObject')
          return Promise.resolve(
            FormDataSerializer.prototype.parseCreate.call(this, context))
          .then(result => {
            const image = result[0]

            return image.uploadTarget.map(buffer => ({
              name: image.name || null,
              description: image.description || null,
              about: 'about' in image ?
                image.about[0].split(',').filter(x => x) : [],
              keywords: 'keywords' in image ?
                image.keywords[0].split(',').filter(x => x) : [],
              imageData: buffer
            }))
          })

      return FormDataSerializer.prototype.parseCreate.call(this, context)
    },

    parseUpdate (context) {
      const type = context.request.type
      context.request.isUpdate = true

      if (type === 'ImageObject')
        return Promise.resolve(
          FormDataSerializer.prototype.parseUpdate.call(this, context))
        .then(result => {
          const replace = result[0].replace

          replace.name = replace.name || null
          replace.description = replace.description || null
          replace.about = replace.about ?
              replace.about[0].split(',').filter(x => x) : []
          replace.keywords = replace.keywords ?
              replace.keywords[0].split(',').filter(x => x) : []

          return result
        })

      return FormDataSerializer.prototype.parseUpdate.call(this, context)
    }

  })

module.exports = CustomFormDataSerializer
