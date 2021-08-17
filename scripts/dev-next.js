#!/usr/bin/env node

const { existsSync } = require('fs')
const { resolve } = require('path')
const { execSync } = require('child_process')

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
if (!existsSync(nextBin)) {
  error(`Please run "yarn install" inside ${target} example directory\n`)
}

const requireHookPath = resolve(__dirname, 'require-hook.js')
const devCmd = `cd ${exampleDir} && node -r ${requireHookPath} ${nextBin} ${nextCmd}`

console.log(`Running ${devCmd}`)

execSync(devCmd, { stdio: 'inherit' })
