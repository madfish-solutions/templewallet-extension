import { After } from '@cucumber/cucumber';

import { E2eRequest, E2eMessageType } from '../../../src/lib/e2e/types';
import { BrowserContext } from '../classes/browser-context.class';

const resetWalletMessage: E2eRequest = { type: E2eMessageType.ResetRequest };

After(async () => {
  // [ Extension storages full reset ]

  await BrowserContext.page.evaluate(
    // @ts-ignore
    message => new Promise(res => chrome.runtime.sendMessage(message, res)),
    resetWalletMessage
  );
  await BrowserContext.page.evaluate(() => void localStorage.clear());

  // [ Extension reload ]

  try {
    // @ts-ignore
    await BrowserContext.page.evaluate(() => void chrome.runtime.reload());
  } catch {}

  try {
    await BrowserContext.page.close();
  } catch {}
});
