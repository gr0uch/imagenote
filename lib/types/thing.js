const fortune = require('fortune')

const createMethod = fortune.methods.create

module.exports = {

  name: 'Thing',

  definition: {
    name: { type: String, isArray: true },
    appearsIn: { link: 'ImageObject', inverse: 'about',
      isArray: true, isReverse: true }
  },

  input (context, record, update) {
    const method = context.request.method

    if (method === createMethod) {
      delete record.id
      return record
    }

    return update || null
  }

}
