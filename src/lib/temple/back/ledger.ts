import type { CreatorArgumentsTuple } from 'lib/ledger';

const MANIFEST_VERSION = process.env.MANIFEST_VERSION;

export const createLedgerSigner = async (...args: CreatorArgumentsTuple) => {
  if (MANIFEST_VERSION === '3') {
    const createLedgerSignerProxy = (await import('lib/ledger/proxy')).createLedgerSignerProxy;
    return createLedgerSignerProxy(...args);
  }

  const transportType = (await import('lib/temple/ledger')).getLedgerTransportType();
  const createDirectLedgerSigner = (await import('lib/ledger')).createLedgerSigner;
  return createDirectLedgerSigner(transportType, ...args);
};
