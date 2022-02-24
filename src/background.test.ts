import { browser } from 'webextension-polyfill-ts';

import { getChromePredicate, getFFPredicate } from './background';

const EXTENSION_ID = 'some-test-id';

// @ts-ignore
browser.runtime = {
  id: EXTENSION_ID,
  getManifest: () => ({
    background: {
      scripts: [`moz-extension://${EXTENSION_ID}/scripts/background.js`]
    },
    manifest_version: 1,
    version: '',
    name: ''
  })
};

const EXTERNAL_CHROME_PORT = {
  sender: {
    url: `chrome-extension://${EXTENSION_ID}/popup.html`
  }
};

const EXTERNAL_MOZ_PORT = {
  sender: {
    url: `moz-extension://${EXTENSION_ID}/popup.html`
  }
};

const DAPP_PORT = {
  sender: {
    url: `https://quipuswap.com/`
  }
};

describe('Background Tests', () => {
  describe('getChromePredicate', () => {
    it('finds correct url', async () => {
      const result = getChromePredicate(EXTERNAL_CHROME_PORT);
      expect(result).toBeTruthy();
    });
    it('not finds correct url', async () => {
      const result = getChromePredicate(DAPP_PORT);
      expect(result).toBeFalsy();
    });
  });
  describe('getFFPredicate', () => {
    it('finds correct url', async () => {
      const result = getFFPredicate(EXTERNAL_MOZ_PORT);
      expect(result).toBeTruthy();
    });
    it('not finds correct url', async () => {
      const result = getFFPredicate(DAPP_PORT);
      expect(result).toBeFalsy();
    });
  });
});
