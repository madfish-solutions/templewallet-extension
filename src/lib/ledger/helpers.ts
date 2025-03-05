import { PublicKeyHashRetrievalError, PublicKeyRetrievalError } from '@taquito/ledger-signer/dist/types/errors';

import { PublicError } from 'lib/temple/back/PublicError';

import { TransportType } from './transport/types';

export const removeMFromDerivationPath = (dPath: string) => (dPath.startsWith('m/') ? dPath.substring(2) : dPath);

export const getLedgerTransportType = () => {
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

export const isPkRetrievalError = (error: unknown): error is PublicKeyRetrievalError =>
  error instanceof Error && error.name === 'PublicKeyRetrievalError';

export const isPkhRetrievalError = (error: unknown): error is PublicKeyHashRetrievalError =>
  error instanceof Error && error.name === 'PublicKeyHashRetrievalError';
