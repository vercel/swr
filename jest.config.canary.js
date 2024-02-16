const config = require('./jest.config')
module.exports = {
  ...config,
  testRegex: [config.testRegex, '/test/canary/.*\\.test\\.tsx?$'],
}
