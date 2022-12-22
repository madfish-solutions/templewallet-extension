import { PublicError } from 'lib/temple/back/PublicError';

import { TransportType } from './transport/types';

export const removeMFromDerivationPath = (dPath: string) => (dPath.startsWith('m/') ? dPath.substring(2) : dPath);

export const pickTransportType = (isLedgerLive: boolean) => {
  if (isLedgerLive) return TransportType.LEDGERLIVE;
  if (isSupportedHID()) return TransportType.WEBHID;
  if (isSupportedWebAuthn()) return TransportType.WEBAUTHN;
  return TransportType.U2F;
};

const isSupportedHID = () => Boolean(navigator?.hid);

const isSupportedWebAuthn = () => Boolean(navigator?.credentials);

export const toLedgerError = (error: string | { message: string }) => {
  const message = typeof error === 'object' ? error.message : error;
  return new PublicError(`Ledger error. ${message}`);
};
