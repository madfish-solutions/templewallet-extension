import { DerivationType } from '@taquito/ledger-signer';

import { getLedgerTransportType } from 'lib/temple/ledger';

import { removeMFromDerivationPath } from './helpers';
import { TempleLedgerSigner } from './signer';
import { TempleLedgerTransport } from './transport';

export const createLedgerSigner = async (
  derivationPath: string,
  derivationType?: DerivationType,
  publicKey?: string,
  publicKeyHash?: string
) => {
  const transport = await createLedgerTransport();

  const signer = new TempleLedgerSigner(
    transport,
    removeMFromDerivationPath(derivationPath),
    true,
    derivationType,
    publicKey,
    publicKeyHash
  );

  // After Ledger Live bridge was setuped, we don't close transport
  // Probably we do not need to close it
  // But if we need, we can close it after not use timeout
  const cleanup = () => {};

  return { signer, cleanup };
};

let soleTransport: TempleLedgerTransport;

const createLedgerTransport = async () => {
  if (soleTransport) await soleTransport.close();

  const transportType = getLedgerTransportType();

  soleTransport = new TempleLedgerTransport(transportType);

  return soleTransport;
};
