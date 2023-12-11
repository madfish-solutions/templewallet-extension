/*
  This proxy solution is meant to allow using a Ledger signer in background script indirectly,
  through messaging to foreground pages, where it will be instantiated.

  Applicable, since direct usage is not suitable for Service Worker environment.

  (!) You need to inject './foreground' script into every foreground page.
*/

import type { CreatorArgumentsTuple } from '../types';

import { TempleLedgerSignerProxy } from './signer';

export const createLedgerSignerProxy = async (
  ...[derivationPath, derivationType, publicKey, publicKeyHash]: CreatorArgumentsTuple
) => {
  const signer = new TempleLedgerSignerProxy({ derivationPath, derivationType, publicKey, publicKeyHash });
  const cleanup = () => {};

  return { signer, cleanup };
};
