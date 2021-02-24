import { store } from './store'

jest.mock('webextension-polyfill-ts', () => ({
  browser: global.chrome,
}));

describe("Web-Extension Helpers", () => {
  it('should ...', async () => {
    const test = store.getState()
    console.log(test);
  })
})
