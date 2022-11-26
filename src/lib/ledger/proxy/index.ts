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
  ProxiedMethodName,
  MethodsSerialArgs,
  MethodsReturns,
  CreatorArguments,
  RequestMessageGeneral,
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
  private creatorArgs: CreatorArguments;
  private id: number;
  constructor(creatorArgs: CreatorArguments) {
    this.creatorArgs = creatorArgs;
    this.id = Date.now();
  }

  publicKey = () => this.requestMethodCall('publicKey');

  publicKeyHash = () => this.requestMethodCall('publicKeyHash');

  async secretKey(): Promise<string | undefined> {
    throw new Error('Secret key cannot be exposed');
  }

  sign = (op: string, magicByte?: Uint8Array) =>
    this.requestMethodCall('sign', {
      op,
      magicByte: magicByte && uInt8ArrayToString(magicByte)
    });

  private async requestMethodCall<N extends ProxiedMethodName>(method: N, args?: MethodsSerialArgs[N]) {
    const message: RequestMessageGeneral = {
      type: 'LEDGER_PROXY_REQUEST',
      instanceId: this.id,
      creatorArgs: this.creatorArgs,
      method,
      args
    };
    const response: ForegroundResponse<MethodsReturns[N]> = await browser.runtime.sendMessage(message);
    if (response.type === 'success') return response.value;
    throw new PublicError(response.message);
  }
}
