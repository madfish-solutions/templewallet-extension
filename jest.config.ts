/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/en/configuration.html
 */

export default {
  coverageProvider: "v8",
  moduleNameMapper: {
    "^lib/(.*)$": "<rootDir>/src/lib/$1",
  },
  testEnvironment: "jsdom",
  transform: {
    ".+\\.ts$": "ts-jest",
  },
  moduleFileExtensions: ["ts", "js"],
  setupFiles: ["@serh11p/jest-webextension-mock"],
  setupFilesAfterEnv: ["./jest.setup.js"],
};
