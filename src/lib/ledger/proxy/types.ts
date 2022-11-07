import type { DerivationType } from '@taquito/ledger-signer';

import type { TempleLedgerSigner } from '../signer';

type AwaitedReturn<T extends (...args: any[]) => any> = Awaited<ReturnType<T>>;

export interface SignerMethodsReturns {
  publicKey: AwaitedReturn<TempleLedgerSigner['publicKey']>;
  publicKeyHash: AwaitedReturn<TempleLedgerSigner['publicKeyHash']>;
  sign: AwaitedReturn<TempleLedgerSigner['sign']>;
}

export interface CreatorArguments {
  derivationPath: string;
  derivationType?: DerivationType;
  publicKey?: string;
  publicKeyHash?: string;
}

export interface RequestMessageBase {
  type: 'LEDGER_MV3_REQUEST';
  instanceId: number;
  creatorArgs: CreatorArguments;
  method: string;
  args?: { [key in string]?: string };
}

interface RequestMessageEmptyMethodCall extends RequestMessageBase {
  method: 'publicKey' | 'publicKeyHash';
}

export interface RequestMessageSignMethodCall extends RequestMessageBase {
  method: 'sign';
  args: { op: string; magicByte?: string };
}

export type RequestMessage = RequestMessageEmptyMethodCall | RequestMessageSignMethodCall;

export type ForegroundResponse<T extends JSONifiable = JSONifiable> =
  | {
      type: 'success';
      value: T;
    }
  | {
      type: 'error';
      message: string;
    };
