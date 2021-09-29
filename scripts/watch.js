/**
 * @type {import('bunchee/dist/src/bundle').default}
 */
const bundle = require('bunchee').bundle
const childProcess = require('child_process')

const args = process.argv
const target = args[2]

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
      push()
    }
    if (event.code === 'ERROR') {
      error(event.error)
      event.result.close()
    }
  })
  teardown(rollupWatcher.close)
}

function push() {
  const sub = childProcess.spawn('yalc', ['push'])
  sub.stdout.on('data', logStdout)
  sub.stderr.on('data', logStderr)
  sub.stderr.on('close', () => {
    sub.stdout.off('data', logStdout)
    sub.stderr.off('data', logStderr)
  })
}

function teardown(cb) {
  process.on('exit', cb)
  process.on('SIGINT', cb)
}

const logStdout = data => process.stdout.write(data.toString())
const logStderr = data => process.stderr.write(data.toString())
start()
