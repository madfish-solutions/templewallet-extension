import type { DerivationType } from '@tezos-x/octez.js-ledger-signer';

import type { TempleLedgerSigner } from '../signer';
import { TransportType } from '../transport';

export type ProxiedMethodName = 'publicKey' | 'publicKeyHash' | 'sign';

export interface MethodsSerialArgs {
  publicKey: undefined;
  publicKeyHash: undefined;
  sign: { op: string; magicByte?: string };
}

type AwaitedReturn<T extends (...args: any[]) => any> = Awaited<ReturnType<T>>;

export interface MethodsReturns {
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

export interface RequestMessageGeneral {
  type: 'LEDGER_PROXY_REQUEST';
  instanceId: number;
  creatorArgs: CreatorArguments;
  method: ProxiedMethodName;
  args?: { [key in string]?: string };
}

interface RequestMessageEmptyMethodCall extends RequestMessageGeneral {
  method: 'publicKey' | 'publicKeyHash';
}

interface RequestMessageSignMethodCall extends RequestMessageGeneral {
  method: 'sign';
  args: MethodsSerialArgs['sign'];
}

export type RequestMessage = RequestMessageEmptyMethodCall | RequestMessageSignMethodCall;

export type ForegroundResponse<T extends JSONifiable | unknown = unknown> =
  | {
      type: 'success';
      value: T;
    }
  | {
      type: 'error';
      message: string;
    }
  | {
      type: 'refusal';
      transportType: TransportType;
    };
