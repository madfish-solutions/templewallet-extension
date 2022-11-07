import { TransportType } from '@temple-wallet/ledger-bridge';

import { PublicError } from 'lib/temple/back/PublicError';

export const removeMFromDerivationPath = (dPath: string) => (dPath.startsWith('m/') ? dPath.substring(2) : dPath);

export const pickTransportType = (isLedgerLive: boolean) => {
  if (isLedgerLive) return TransportType.LEDGERLIVE;
  const navigator: Navigator | undefined = window.navigator;
  return navigator && navigator.hid ? TransportType.WEBHID : TransportType.U2F;
};

export const toLedgerError = (error: string | { message: string }) => {
  const message = typeof error === 'object' ? error.message : error;
  return new PublicError(`Ledger error. ${message}`);
};
