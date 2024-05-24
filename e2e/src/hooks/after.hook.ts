import { After } from '@cucumber/cucumber';
import retry from 'async-retry';
import { E2eMessageType } from 'src/lib/e2e/types';

import { CustomBrowserContext } from '../../../e2e-tests/src/classes/browser-context.class';
import { RETRY_OPTIONS, MEDIUM_TIMEOUT } from '../../../e2e-tests/src/utils/timing.utils';

const FAILED_RESET_ERROR = new Error('Failed to reset extension');

After({ timeout: MEDIUM_TIMEOUT }, async () => {
  await CustomBrowserContext.recorder.stop();

  // [ Extension storages full reset ]

  await CustomBrowserContext.page.evaluate(
    // @ts-ignore
    message => new Promise(res => chrome.runtime.sendMessage(message, res)),
    { type: E2eMessageType.ResetRequest }
  );
  await CustomBrowserContext.page.evaluate(() => void localStorage.clear());

  // [ Extension reload ]

  // @ts-ignore
  await CustomBrowserContext.page.evaluate(() => void chrome.runtime.reload()).catch(() => void 0);

  await retry(() => {
    if (CustomBrowserContext.page.isClosed() === false) throw FAILED_RESET_ERROR;
  }, RETRY_OPTIONS);
});
