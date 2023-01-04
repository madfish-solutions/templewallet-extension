/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/en/configuration.html
 */

const config = {
  coverageProvider: 'v8',
  moduleNameMapper: {
    '^lib/(.*)$': '<rootDir>/src/lib/$1'
  },
  testEnvironment: 'jsdom',
  transform: {
    '.+\\.ts$': 'ts-jest',
    '.+\\.tsx$': 'ts-jest'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  setupFiles: ['dotenv/config', '@serh11p/jest-webextension-mock'],
  setupFilesAfterEnv: ['./jest.setup.js']
};

export default config;
