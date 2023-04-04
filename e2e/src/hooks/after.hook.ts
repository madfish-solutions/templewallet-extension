// import { After } from '@cucumber/cucumber';
// import retry from 'async-retry';
//
// import { E2eMessageType } from '../../../src/lib/e2e/types';
// import { BrowserContext } from '../classes/browser-context.class';
// import { RETRY_OPTIONS, SHORT_TIMEOUT } from '../utils/timing.utils';
//
// const FAILED_RESET_ERROR = new Error('Failed to reset extension');
//
// After({ timeout: SHORT_TIMEOUT }, async () => {
//   // [ Extension storages full reset ]
//
//   await BrowserContext.page.evaluate(
//     // @ts-ignore
//     message => new Promise(res => chrome.runtime.sendMessage(message, res)),
//     { type: E2eMessageType.ResetRequest }
//   );
//   await BrowserContext.page.evaluate(() => void localStorage.clear());
//
//   // [ Extension reload ]
//
//   // @ts-ignore
//   await BrowserContext.page.evaluate(() => void chrome.runtime.reload()).catch(() => void 0);
//
//   await retry(() => {
//     if (BrowserContext.page.isClosed() === false) throw FAILED_RESET_ERROR;
//   }, RETRY_OPTIONS);
// });
