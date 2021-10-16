module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testRegex: '/test/.*\\.test\\.tsx$',
  modulePathIgnorePatterns: ['<rootDir>/examples/'],
  setupFilesAfterEnv: ['<rootDir>/scripts/jest-setup.ts'],
  globals: {
    'ts-jest': {
      tsconfig: 'test/tsconfig.json',
      diagnostics: process.env.CI
    }
  },
  transform: {
    '^.+\\.(t|j)sx?$': [
      '@swc-node/jest',
      {
        jsc: {
          minify: false,
        }
      },
    ],
  },
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/', '/test/'],
  coverageProvider: 'v8',
  coverageReporters: ['text']
}
