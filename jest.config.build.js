const config = require("./jest.config");
module.exports = {
  ...config,
  // override to use build files
  moduleNameMapper: {}
}
