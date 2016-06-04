const fortune = require('fortune')
const settings = require('../settings')

const createMethod = fortune.methods.create
const BadRequestError = fortune.errors.BadRequestError

module.exports = {

  name: 'Comment',

  definition: {
    text: { type: String },
    dateCreated: { type: Date },
    ip: { type: String },
    about: { link: 'ImageObject', inverse: 'comment' }
  },

  input (context, record, update) {
    const method = context.request.method
    const remoteAddress = context.request.remoteAddress

    if (method === createMethod) {
      delete record.id
      record.dateCreated = new Date()
      record.ip = remoteAddress

      if (!record.text)
        throw new BadRequestError('Comment is missing.')

      if (record.text.length > settings.maxCommentLength)
        throw new BadRequestError('Comment is too long, maximum length of ' +
          `${settings.maxCommentLength} characters.`)

      return record
    }

    return update || null
  },

  output (context, record) {
    delete record.ip
    return record
  }

}
