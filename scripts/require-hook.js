const { resolve } = require('path')
const mod = require('module')

const rootDir = resolve(__dirname, '..')
const nodeModulesDir = resolve(rootDir, 'node_modules')

const hookPropertyMap = new Map([
  ['swr', resolve(rootDir, 'dist/index.js')],
  ['swr/infinite', resolve(rootDir, 'infinite/dist/index.js')],
  ['swr/immutable', resolve(rootDir, 'immutable/dist/index.js')],
  ['react', resolve(nodeModulesDir, 'react')],
  ['react-dom', resolve(nodeModulesDir, 'react-dom')],
])

const resolveFilename = mod._resolveFilename
mod._resolveFilename = function (request, ...args) {
  const hookResolved = hookPropertyMap.get(request)
  if (hookResolved) request = hookResolved
  return resolveFilename.call(mod, request, ...args)
}
