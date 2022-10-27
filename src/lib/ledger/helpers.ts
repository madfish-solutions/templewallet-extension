import { TransportType } from '@temple-wallet/ledger-bridge';

export function removeMFromDerivationPath(dPath: string) {
  return dPath.startsWith('m/') ? dPath.substring(2) : dPath;
}

export function pickTransportType(isLedgerLive: boolean) {
  if (isLedgerLive) return TransportType.LEDGERLIVE;
  const navigator: Navigator | undefined = window.navigator;
  return navigator && navigator.hid ? TransportType.WEBHID : TransportType.U2F;
}
