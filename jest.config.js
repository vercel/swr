module.exports = {
  preset: 'ts-jest',
  testRegex: '/test/.*\\.test\\.tsx$',
  globals: {
    'ts-jest': {
      diagnostics: {
        warnOnly: true
      }
    }
  }
}