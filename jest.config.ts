/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/en/configuration.html
 */

const config = {
  testMatch: [ "**/__tests__/**/*.[jt]s?(x)", "**/*.@(spec|test).[jt]s?(x)", "!**/e2e/**" ],
  coverageProvider: 'v8',
  // To have Jest respect `baseUrl`:
  moduleDirectories: ['node_modules', 'src'],
  testEnvironment: './jest-fixed-environment.js',
  // `multiformats` is ESM-only (no `require` export). Map subpaths to files and transpile them.
  moduleNameMapper: {
    '^multiformats$': '<rootDir>/node_modules/multiformats/dist/src/index.js',
    '^multiformats/(.*)$': '<rootDir>/node_modules/multiformats/dist/src/$1.js'
  },
  transformIgnorePatterns: ['/node_modules/(?!multiformats/)'],
  transform: {
    '.+\\.ts$': 'ts-jest',
    '.+\\.tsx$': 'ts-jest',
    'node_modules/multiformats/.+\\.js$': './jest-esm-to-cjs-transformer.js'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  setupFiles: ['dotenv/config', '@temple-wallet/jest-webextension-mock', 'fake-indexeddb/auto'],
  setupFilesAfterEnv: ['./jest.setup.js']
};

export default config;
