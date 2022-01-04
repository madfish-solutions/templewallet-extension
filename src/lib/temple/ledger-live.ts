import { TempleSharedStorageKey } from 'lib/temple/types';

export async function isLedgerLiveEnabledByDefault() {
  return process.env.TARGET_BROWSER === 'chrome';
}

export async function isLedgerLiveEnabled() {
  const isLedgerLive = localStorage.getItem(TempleSharedStorageKey.UseLedgerLive) === 'true';
  if (isLedgerLive) return await isLedgerLiveEnabledByDefault();
  return false;
}
