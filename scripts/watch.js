/**
 * @type {import('bunchee/dist/src/bundle').default}
 */
const bundle = require('bunchee').bundle
const childProcess = require('child_process')

const args = process.argv
const target = args[2] || 'core'

const entryMap = {
  core: {
    entry: 'src/index.ts',
    cwd: ''
  },
  infinite: {
    entry: 'index.ts',
    cwd: 'infinite'
  },
  immutable: {
    entry: 'index.ts',
    cwd: 'immutable'
  }
}

function error(message) {
  console.log(message)
  process.exit(1)
}

function start() {
  const option = entryMap[target]
  if (option) {
    bundle(option.entry, {
      watch: true,
      cwd: option.cwd,
      sourcemap: true
    })
      .then(watch)
      .catch(e => {
        console.log(e)
      })
  } else {
    error(`package ${target} not found`)
  }
}
/**
 *
 * @param {import('rollup').RollupWatcher} rollupWatcher
 */
function watch(rollupWatcher) {
  rollupWatcher.on('event', event => {
    if (event.code === 'BUNDLE_END') {
      event.result.close()
    }
    if (event.code === 'ERROR') {
      error(event.error)
      event.result.close()
    }
  })
  teardown(rollupWatcher.close)
}


function teardown(cb) {
  process.on('exit', cb)
  process.on('SIGINT', cb)
}

start()
