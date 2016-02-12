'use strict'

const randomBytes = require('crypto').randomBytes
const fortune = require('fortune')
const chalk = require('chalk')
const settings = require('./settings')
const log = require('./log')
const postgresAdapter = require('fortune-postgres')

// Record types.
const ImageObject = require('./types/image_object')
const Thing = require('./types/thing')
const Comment = require('./types/comment')
const recordTypes = {}
const transforms = {}

for (let type of [ ImageObject, Thing, Comment ]) {
  recordTypes[type.name] = type.definition
  transforms[type.name] = [ type.input, type.output ]
}

const store = fortune(recordTypes, {
  adapter: [
    postgresAdapter,
    {
      url: settings.databaseUrl,
      generatePrimaryKey: () =>
        `${Date.now()}_${randomBytes(2).toString('hex')}`,
      isNative: true
    }
  ],
  transforms
})

// Inject dependency.
ImageObject.adapter = store.adapter

module.exports = store

// Try to delete up to 50 IDs which have no images associated to them every
// 8 hours.
setInterval(() => {
  store.adapter.find('Thing', null, {
    fields: { appearsIn: true },
    sort: { appearsIn: true },
    limit: 50
  })
  .then(records => {
    const deleteIDs = []

    for (let record of records)
      if (!record.appearsIn.length)
        deleteIDs.push(record.id)

    return store.adapter.delete('Thing', deleteIDs)
  })
  .then(number => {
    if (number) log(chalk.yellow(`Deleted ${chalk.bold(number)} ` +
      `ID${number !== 1 ? 's' : ''}!`))
  })
}, 8 * 60 * 60 * 1000)
