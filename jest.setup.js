const { chrome } = require( 'jest-chrome')

jest.mock('webextension-polyfill-ts', () => ({
  browser: chrome,
}));
