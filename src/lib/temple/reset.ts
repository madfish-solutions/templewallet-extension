import { browser } from 'webextension-polyfill-ts';

import { IS_BROWSER_ENV } from 'lib/env';
import * as Repo from 'lib/temple/repo';

export async function clearStorages() {
  await Repo.db.delete();
  await Repo.db.open();
  await browser.storage.local.clear();

  if(IS_BROWSER_ENV) localStorage.clear();
}
