/*
  This proxy solution is meant to allow using a Ledger signer in background script indirectly,
  through messaging to foreground pages, where it will be instantiated.

  Applicable, since direct usage is not suitable for Service Worker environment.

  (!) You need to inject './foreground' script into every foreground page.
*/

import type { DerivationType } from '@taquito/ledger-signer';
import type { Signer } from '@taquito/taquito';
import browser from 'webextension-polyfill';

import { PublicError } from 'lib/temple/back/PublicError';

import type {
  SignerMethodsReturns,
  CreatorArguments,
  RequestMessageBase,
  RequestMessageSignMethodCall,
  ForegroundResponse
} from './types';
import { uInt8ArrayToString } from './utils';

export const createLedgerSignerProxy = async (
  derivationPath: string,
  derivationType?: DerivationType,
  publicKey?: string,
  publicKeyHash?: string
) => {
  const signer = new TempleLedgerSignerProxy({ derivationPath, derivationType, publicKey, publicKeyHash });
  const cleanup = () => {};

  return { signer, cleanup };
};

class TempleLedgerSignerProxy implements Signer {
  constructor(private creatorArgs: CreatorArguments) {}

  publicKey = () => this.requestMethodCall<SignerMethodsReturns['publicKey']>('publicKey');

  publicKeyHash = () => this.requestMethodCall<SignerMethodsReturns['publicKeyHash']>('publicKeyHash');

  async secretKey(): Promise<string | undefined> {
    throw new Error('Secret key cannot be exposed');
  }

  sign(op: string, magicByte?: Uint8Array) {
    const args: RequestMessageSignMethodCall['args'] = {
      op,
      magicByte: magicByte && uInt8ArrayToString(magicByte)
    };
    return this.requestMethodCall<SignerMethodsReturns['sign']>('sign', args);
  }

  private async requestMethodCall<R extends JSONifiable>(
    method: RequestMessageBase['method'],
    args?: RequestMessageBase['args']
  ) {
    const message: RequestMessageBase = {
      type: 'LEDGER_MV3_REQUEST',
      creatorArgs: this.creatorArgs,
      method,
      args
    };
    const response: ForegroundResponse<R> = await browser.runtime.sendMessage(message);
    if (response.type === 'success') return response.value;
    throw new PublicError(response.message);
  }
}
