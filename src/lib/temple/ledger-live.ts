import { browser } from "webextension-polyfill-ts";

import { TempleSharedStorageKey } from "lib/temple/types";

export async function isLedgerLiveEnabledByDefault() {
  const isWin = (await browser.runtime.getPlatformInfo()).os === "win";
  return process.env.TARGET_BROWSER === "chrome" && !isWin;
}

export async function isLedgerLiveEnabled() {
  return (
    localStorage.getItem(TempleSharedStorageKey.UseLedgerLive) === "true" ||
    (await isLedgerLiveEnabledByDefault())
  );
}
