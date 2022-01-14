module.exports = {
  testEnvironment: 'jsdom',
  testRegex: '/test/.*\\.test\\.tsx?$',
  modulePathIgnorePatterns: ['<rootDir>/examples/'],
  setupFilesAfterEnv: ['<rootDir>/test/jest-setup.ts'],
  moduleNameMapper: {
    '^swr$': '<rootDir>/src',
    '^swr/infinite$': '<rootDir>/infinite/index.ts',
    '^swr/immutable$': '<rootDir>/immutable/index.ts'
  },
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest'
  },
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/', '/test/'],
  coverageReporters: ['text', 'html']
}
