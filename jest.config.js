module.exports = {
  preset: 'ts-jest',
  testRegex: '/test/.*\\.test\\.tsx$',
  modulePathIgnorePatterns: ['<rootDir>/examples/'],
  setupFilesAfterEnv: ['<rootDir>/jest-setup.ts'],
  moduleNameMapper: {
    swr: '<rootDir>/dist/index.js'
  },
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json'
    }
  }
}
