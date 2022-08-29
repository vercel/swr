module.exports = {
  testEnvironment: 'jsdom',
  testRegex: '/test/.*\\.test\\.tsx?$',
  modulePathIgnorePatterns: ['<rootDir>/examples/'],
  setupFilesAfterEnv: ['<rootDir>/test/jest-setup.ts'],
  moduleNameMapper: {
    '^swr$': '<rootDir>/core.ts',
    '^swr/infinite$': '<rootDir>/infinite.ts',
    '^swr/immutable$': '<rootDir>/immutable.ts',
    '^swr/mutation$': '<rootDir>/mutation.ts',
    '^swr/_internal$': '<rootDir>/_internal.ts'
  },
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest'
  },
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/', '/test/'],
  coverageReporters: ['text', 'html'],
  reporters: ['default', 'github-actions']
}
