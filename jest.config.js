module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testRegex: '/test/.*\\.test\\.tsx$',
  modulePathIgnorePatterns: ['<rootDir>/examples/'],
  setupFilesAfterEnv: ['<rootDir>/jest-setup.ts'],
  moduleNameMapper: {
    '^swr$': '<rootDir>/src',
    '^@swr-internal/(.*)': '<rootDir>/src/$1'
  },
  globals: {
    'ts-jest': {
      tsconfig: 'test/tsconfig.json'
    }
  }
}
