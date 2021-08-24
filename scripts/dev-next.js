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
  error(`Please run "yarn install" inside ${target} example directory\n`)
}

const requireHookPath = resolve(__dirname, 'require-hook.js')
const nextConfigPath = resolve(exampleDir, 'next.config.js')
const devCmd = `node -r ${requireHookPath} ${nextBin} ${nextCmd}`.split(' ')

if (!fs.existsSync(nextConfigPath)) {
  fs.symlinkSync(resolve(__dirname, 'next-config.js'), nextConfigPath, 'file')
}

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
  if (fs.existsSync(nextConfigPath)) fs.unlinkSync(nextConfigPath)
}

process.on('exit', teardown)
process.on('SIGINT', teardown)

// main
console.log(`Running ${devCmd.join(' ')}`)
