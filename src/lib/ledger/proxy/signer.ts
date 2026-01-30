import type { Signer } from '@tezos-x/octez.js';
import browser from 'webextension-polyfill';

import { PublicError } from 'lib/temple/back/PublicError';
import { uInt8ArrayToString } from 'lib/utils';

import type {
  ProxiedMethodName,
  MethodsSerialArgs,
  MethodsReturns,
  CreatorArguments,
  RequestMessageGeneral,
  ForegroundResponse
} from './types';

export class TempleLedgerSignerProxy implements Signer {
  private creatorArgs: CreatorArguments;
  private id: number;
  private signer?: Signer;
  constructor(creatorArgs: CreatorArguments) {
    this.creatorArgs = creatorArgs;
    this.id = Date.now();
  }

  publicKey = () => this.requestMethodCall({ name: 'publicKey' }, signer => signer.publicKey());

  publicKeyHash = () => this.requestMethodCall({ name: 'publicKeyHash' }, signer => signer.publicKeyHash());

  sign = (op: string, magicByte?: Uint8Array) =>
    this.requestMethodCall(
      {
        name: 'sign',
        args: {
          op,
          magicByte: magicByte && uInt8ArrayToString(magicByte)
        }
      },
      signer => signer.sign(op, magicByte)
    );

  async secretKey(): Promise<string | undefined> {
    throw new Error('Secret key cannot be exposed');
  }

  private async requestMethodCall<N extends ProxiedMethodName, FallbackReturn = any>(
    { name: method, args }: { name: N; args?: MethodsSerialArgs[N] },
    fallback: (signer: Signer) => Promise<FallbackReturn>
  ) {
    if (this.signer) return fallback(this.signer);

    const message: RequestMessageGeneral = {
      type: 'LEDGER_PROXY_REQUEST',
      instanceId: this.id,
      creatorArgs: this.creatorArgs,
      method,
      args
    };

    const response: ForegroundResponse<MethodsReturns[N]> = await browser.runtime.sendMessage(message);

    if (response.type === 'success') return response.value;

    if (response.type === 'refusal') {
      /* Foreground proactively refused to handle request */
      const createLedgerSigner = (await import('../index')).createLedgerSigner;
      const { derivationPath, derivationType, publicKey, publicKeyHash } = this.creatorArgs;
      const { signer } = await createLedgerSigner(
        response.transportType,
        derivationPath,
        derivationType,
        publicKey,
        publicKeyHash
      );
      this.signer = signer;

      return fallback(signer);
    }

    throw new PublicError(response.message);
  }
}
