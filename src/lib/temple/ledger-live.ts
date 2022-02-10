import { TransportType } from '@temple-wallet/ledger-bridge';

import { TempleSharedStorageKey } from 'lib/temple/types';

export function pickLedgerTransport() {
  const savedTransport = localStorage.getItem(TempleSharedStorageKey.UseLedgerLive);

  return pickTransport(savedTransport === 'true');
}

export function pickTransport(isLedgerLive: boolean) {
  if (isLedgerLive) return TransportType.LEDGERLIVE;
  // @ts-ignore
  return window.navigator && window.navigator.hid ? TransportType.WEBHID : TransportType.U2F;
}
