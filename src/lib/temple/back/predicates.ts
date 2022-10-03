import { browser } from 'webextension-polyfill-ts';

const URL_BASE = 'extension://';

export const getChromePredicate = (port: any) => port.sender?.url?.includes(`${URL_BASE}${browser.runtime.id}`);
export const getFFPredicate = (port: any) => {
  const manifest: any = browser.runtime.getManifest();
  const fullUrl = manifest.background?.scripts[0];
  const edgeUrl = fullUrl.split('/scripts')[0].split('://')[1];
  return port.sender?.url?.includes(`${URL_BASE}${edgeUrl}`);
};
