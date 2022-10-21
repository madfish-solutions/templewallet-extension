import browser from 'webextension-polyfill';

import { isChromePredicate, isFFPredicate, isExtensionPageByPort } from 'lib/temple/back/helpers';

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

const CHROME_PAGE_URL = `chrome-extension://${EXTENSION_ID}/popup.html`;
const EXTERNAL_CHROME_PORT = {
  sender: {
    url: CHROME_PAGE_URL
  }
} as browser.Runtime.Port;

const MOZ_PAGE_URL = `moz-extension://${EXTENSION_ID}/popup.html`;
const EXTERNAL_MOZ_PORT = {
  sender: {
    url: MOZ_PAGE_URL
  }
} as browser.Runtime.Port;

const DAPP_PAGE_URL = 'https://quipuswap.com/';
const DAPP_PORT = {
  sender: {
    url: DAPP_PAGE_URL
  }
} as browser.Runtime.Port;

describe('Background Tests', () => {
  describe('isChromePredicate', () => {
    it('finds correct url', async () => {
      const result = isChromePredicate(CHROME_PAGE_URL);
      expect(result).toBeTruthy();
    });
    it('not finds correct url', async () => {
      const result = isChromePredicate(DAPP_PAGE_URL);
      expect(result).toBeFalsy();
    });
  });

  describe('isFFPredicate', () => {
    it('finds correct url', async () => {
      const result = isFFPredicate(MOZ_PAGE_URL);
      expect(result).toBeTruthy();
    });
    it('not finds correct url', async () => {
      const result = isFFPredicate(DAPP_PAGE_URL);
      expect(result).toBeFalsy();
    });
  });

  describe('isExtensionPageByPort', () => {
    it('confirms page by port', async () => {
      const result = isExtensionPageByPort(EXTERNAL_CHROME_PORT);
      expect(result).toBeTruthy();
    });
    it('confirms page by port', async () => {
      const result = isExtensionPageByPort(EXTERNAL_MOZ_PORT);
      expect(result).toBeTruthy();
    });
    it('not confirms page by port', async () => {
      const result = isExtensionPageByPort(DAPP_PORT);
      expect(result).toBeFalsy();
    });
  });
});
