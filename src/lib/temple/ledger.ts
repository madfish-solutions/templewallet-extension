import { pickTransportType } from 'lib/ledger/helpers';
import { TempleSharedStorageKey } from 'lib/temple/types';

export function getLedgerTransportType() {
  const isLedgerLive = localStorage.getItem(TempleSharedStorageKey.UseLedgerLive);

  return pickTransportType(isLedgerLive === 'true');
}
