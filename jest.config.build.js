import config from './jest.config.js'

const useBuildConfig = {
  ...config,
  // override to use build files
  moduleNameMapper: {}
}

export default useBuildConfig
