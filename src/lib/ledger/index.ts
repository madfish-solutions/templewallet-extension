import type { DerivationType } from '@taquito/ledger-signer';

import { removeMFromDerivationPath } from './helpers';
import { TempleLedgerSigner } from './signer';
import { TransportType, TempleLedgerTransport } from './transport';

export type CreatorArgumentsTuple = [
  derivationPath: string,
  derivationType?: DerivationType,
  publicKey?: string,
  publicKeyHash?: string
];

export const createLedgerSigner = async (
  transportType: TransportType,
  ...[derivationPath, derivationType, publicKey, publicKeyHash]: CreatorArgumentsTuple
) => {
  const transport = await createLedgerTransport(transportType);

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

let keptTransport: TempleLedgerTransport;

const createLedgerTransport = async (transportType: TransportType) => {
  if (keptTransport) await keptTransport.close();

  keptTransport = new TempleLedgerTransport(transportType);

  return keptTransport;
};
