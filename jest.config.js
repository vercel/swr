module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testRegex: '/test/.*\\.test\\.tsx$',
  modulePathIgnorePatterns: ['<rootDir>/examples/'],
  setupFilesAfterEnv: ['<rootDir>/scripts/jest-setup.ts'],
  moduleNameMapper: {
    '^swr$': '<rootDir>/src',
    '^swr/infinite$': '<rootDir>/infinite/index.ts',
    '^swr/immutable$': '<rootDir>/immutable/index.ts'
  },
  globals: {
    'ts-jest': {
      tsconfig: 'test/tsconfig.json',
      diagnostics: process.env.CI
    }
  },
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/', '/test/'],
  coverageProvider: 'v8',
  coverageReporters: ['text']
}
