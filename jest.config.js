module.exports = {
  testEnvironment: 'jsdom',
  testRegex: '/test/.*\\.test\\.tsx?$',
  modulePathIgnorePatterns: ['<rootDir>/examples/'],
  setupFilesAfterEnv: ['<rootDir>/test/jest-setup.ts'],
  moduleNameMapper: {
    '^swr$': '<rootDir>/core/index.ts',
    '^swr/infinite$': '<rootDir>/infinite/index.ts',
    '^swr/immutable$': '<rootDir>/immutable/index.ts',
    '^swr/mutation$': '<rootDir>/mutation/index.ts',
    '^swr/_internal$': '<rootDir>/_internal/index.ts'
  },
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest'
  },
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/', '/test/'],
  coverageReporters: ['text', 'html'],
  reporters: ['default', 'github-actions']
}
