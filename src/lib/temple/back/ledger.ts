import { BACKGROUND_IS_WORKER } from 'lib/env';
import type { TransportType, CreatorArgumentsTuple } from 'lib/ledger/types';

export const createLedgerSigner = async (...args: CreatorArgumentsTuple) => {
  if (BACKGROUND_IS_WORKER) return createLedgerSignerProxy(...args);

  const transportType = (await import('lib/ledger/helpers')).getLedgerTransportType();

  if (transportType === 'webauthn' || transportType === 'u2f') return createLedgerSignerProxy(...args);

  return createDirectLedgerSigner(transportType, ...args);
};

const createDirectLedgerSigner = async (transportType: TransportType, ...args: CreatorArgumentsTuple) => {
  const create = (await import('lib/ledger')).createLedgerSigner;
  return create(transportType, ...args);
};

const createLedgerSignerProxy = async (...args: CreatorArgumentsTuple) => {
  const create = (await import('lib/ledger/proxy')).createLedgerSignerProxy;
  return create(...args);
};
