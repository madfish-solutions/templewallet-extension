/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/en/configuration.html
 */

const config = {
  testMatch: [ "**/__tests__/**/*.[jt]s?(x)", "**/*.@(spec|test).[jt]s?(x)", "!**/e2e/**" ],
  coverageProvider: 'v8',
  // To have Jest respect `baseUrl`:
  moduleDirectories: ['node_modules', 'src'],
  testEnvironment: 'jsdom',
  transform: {
    '.+\\.ts$': 'ts-jest',
    '.+\\.tsx$': 'ts-jest'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  setupFiles: ['dotenv/config', '@temple-wallet/jest-webextension-mock', 'fake-indexeddb/auto'],
  setupFilesAfterEnv: ['./jest.setup.js']
};

export default config;
