const fortune = require('fortune')

const createMethod = fortune.methods.create
const ForbiddenError = fortune.errors.ForbiddenError

module.exports = {

  name: 'Thing',

  definition: {
    name: { type: String, isArray: true },
    appearsIn: { link: 'ImageObject', inverse: 'about',
      isArray: true, isReverse: true }
  },

  input (context, record) {
    const method = context.request.method

    if (method === createMethod) {
      delete record.id
      return record
    }

    throw new ForbiddenError()
  },

  output (context, record) {
    return record
  }

}
