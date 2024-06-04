import retry from 'async-retry';
import { E2eMessageType } from 'src/lib/e2e/types';

import { CustomBrowserContext } from '../classes/browser-context.class';
import { RETRY_OPTIONS } from '../utils/timing.utils';

const FAILED_RESET_ERROR = new Error('Failed to reset extension');

export async function afterEachHook() {
  await CustomBrowserContext.page.evaluate(message => new Promise(res => chrome.runtime.sendMessage(message, res)), {
    type: E2eMessageType.ResetRequest
  });
  await CustomBrowserContext.page.evaluate(() => localStorage.clear());

  // [ Extension reload ]

  await CustomBrowserContext.page.evaluate(() => chrome.runtime.reload()).catch(() => void 0);

  await retry(() => {
    if (!CustomBrowserContext.page.isClosed()) throw FAILED_RESET_ERROR;
  }, RETRY_OPTIONS);
}
