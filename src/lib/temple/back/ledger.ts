import type { TransportType, CreatorArgumentsTuple } from 'lib/ledger/types';

const MANIFEST_VERSION = (process.env.MANIFEST_VERSION as '3' | '2' | undefined) || '2';

export const createLedgerSigner = async (...args: CreatorArgumentsTuple) => {
  if (MANIFEST_VERSION === '3') return createLedgerSignerProxy(...args);

  const transportType = (await import('lib/temple/ledger')).getLedgerTransportType();

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
