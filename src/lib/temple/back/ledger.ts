import type { TransportType, CreatorArgumentsTuple } from 'lib/ledger';

export const createLedgerSigner = async (...args: CreatorArgumentsTuple) => {
  if (process.env.MANIFEST_VERSION === '3') return createLedgerSignerProxy(...args);

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
