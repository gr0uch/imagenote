'use strict'

const chalk = require('chalk')
const cluster = require('cluster')
const cpuCount = require('os').cpus().length
const app = require('./app')
const settings = require('./settings')
const log = require('./log')
const store = app.store
const server = app.server


if (cluster.isMaster)
  store.connect().then(() => {
    for (let i = 0; i < cpuCount; i++) cluster.fork()

    cluster.on('exit', (worker, signal, code) => {
      log(chalk.yellow(`Worker PID ${worker.process.pid} exited ` +
        `(${signal || code}). Restarting...`))
      cluster.fork()
    })

    cluster.on('listening', (worker, address) => {
      log(chalk.cyan(`Worker PID ${worker.process.pid} is now listening ` +
        `on ${chalk.bold(address.port)}...`))
    })

    return store.disconnect()
  })
  .catch(error => log(chalk.red(error.stack)))

else store.connect()
.then(() => server.listen(settings.port))
.catch(error => log(chalk.red(error.stack)))
