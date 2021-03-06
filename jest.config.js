module.exports = {
  preset: 'ts-jest',
  testRegex: '/test/.*\\.test\\.tsx$',
  modulePathIgnorePatterns: ['<rootDir>/examples/'],
  setupFilesAfterEnv: ['<rootDir>/jest-setup.ts'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json'
    }
  }
}
