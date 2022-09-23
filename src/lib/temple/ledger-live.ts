import { TransportType } from '@temple-wallet/ledger-bridge';

import { TempleSharedStorageKey } from 'lib/temple/types';

export function pickLedgerTransport() {
  const savedTransport = localStorage.getItem(TempleSharedStorageKey.UseLedgerLive);

  return pickTransport(savedTransport === 'true');
}

function pickTransport(isLedgerLive: boolean) {
  if (isLedgerLive) return TransportType.LEDGERLIVE;
  const navigator = window.navigator as undefined | (Navigator & { hid: unknown });
  return navigator && navigator.hid ? TransportType.WEBHID : TransportType.U2F;
}
