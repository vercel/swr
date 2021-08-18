const { resolve } = require('path')

module.exports = {
  webpack(config) {
    const { alias } = config.resolve

    // FIXME: resolving react/jsx-runtime https://github.com/facebook/react/issues/20235
    alias['react/jsx-dev-runtime'] = require.resolve('react/jsx-dev-runtime.js')
    alias['react/jsx-runtime'] = require.resolve('react/jsx-runtime.js')
    
    alias['swr'] = resolve(__dirname, '../dist/index.js')
    alias['swr/infinite'] = resolve(__dirname, '../infinite/dist/index.js')
    alias['swr/immutable'] = resolve(__dirname, '../immutable/dist/index.js')

    alias['react'] = require.resolve('react')
    alias['react-dom'] = require.resolve('react-dom')
    alias['react-dom/server'] = require.resolve('react-dom/server')

    return config
  },
}