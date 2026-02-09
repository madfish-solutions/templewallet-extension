import type { DerivationType } from '@tezos-x/octez.js-ledger-signer';

export { TransportType } from './transport/types';

export type CreatorArgumentsTuple = [
  derivationPath: string,
  derivationType?: DerivationType,
  publicKey?: string,
  publicKeyHash?: string
];
