/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/en/configuration.html
 */

export default {
  clearMocks: true,
  coverageProvider: "v8",
  moduleNameMapper: {
    '^lib/(.*)$': '<rootDir>/src/lib/$1'
  },
  testEnvironment: "node",
  transform: {
    ".+\\.ts$": "ts-jest",
  },
  moduleFileExtensions: ["ts", "js"],
  setupFilesAfterEnv: ['./jest.setup.js'],
};
