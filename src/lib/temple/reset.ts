import { browser } from "webextension-polyfill-ts";

import * as Repo from "lib/temple/repo";

export async function clearStorage() {
  await Repo.db.delete();
  await browser.storage.local.clear();
  await localStorage.clear();
}