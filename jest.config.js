const config = {
  testEnvironment: 'jsdom',
  testRegex: '/test/.*\\.test\\.tsx?$',
  testPathIgnorePatterns: ['/node_modules/', '/e2e/'],
  modulePathIgnorePatterns: ['<rootDir>/examples/'],
  setupFilesAfterEnv: ['<rootDir>/test/jest-setup.ts'],
  moduleNameMapper: {
    '^swr$': '<rootDir>/src/index/index.ts',
    '^swr/infinite$': '<rootDir>/src/infinite/index.ts',
    '^swr/immutable$': '<rootDir>/src/immutable/index.ts',
    '^swr/subscription$': '<rootDir>/src/subscription/index.ts',
    '^swr/mutation$': '<rootDir>/src/mutation/index.ts',
    '^swr/_internal$': '<rootDir>/src/_internal/index.ts'
  },
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest'
  },
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/test/',
    '<rootDir>/src/_internal/utils/env.ts'
  ],
  coverageReporters: ['text', 'html'],
  reporters: [['github-actions', { silent: false }], 'summary']
}

export default config
