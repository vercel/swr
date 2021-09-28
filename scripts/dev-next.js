#!/usr/bin/env node

const fs = require('fs')
const { resolve } = require('path')
const childProcess = require('child_process')

const args = process.argv
const target = args[2]
const nextCmd = args[3] || 'dev'

function error(message) {
  console.log(message)
  process.exit(1)
}

if (!target) {
  error(`Example ${target} is not found\n`)
}

const examplesDir = resolve(__dirname, '../examples')
const exampleDir = resolve(examplesDir, target)

const nextBin = resolve(exampleDir, 'node_modules/.bin/next')
if (!fs.existsSync(nextBin)) {
  error(`Please run "yarn install && npx yalc link swr" inside ${target} example directory\n`)
}

const devCmd = `node ${nextBin} ${nextCmd}`.split(' ')

const sub = childProcess.spawn(devCmd.shift(), devCmd, { cwd: exampleDir })

const logStdout = data => process.stdout.write(data.toString())
const logStderr = data => process.stderr.write(data.toString())

sub.stdout.on('data', logStdout)
sub.stderr.on('data', logStderr)
sub.stderr.on('close', () => {
  sub.stdout.off('data', logStdout)
  sub.stderr.off('data', logStderr)
})

const teardown = () => {
  if (sub.killed) sub.kill('SIGINT')
}

process.on('exit', teardown)
process.on('SIGINT', teardown)

// main
console.log(`Running ${devCmd.join(' ')}`)
