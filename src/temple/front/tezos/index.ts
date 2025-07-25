import {
  WalletProvider,
  createOriginationOperation,
  createSetDelegateOperation,
  createIncreasePaidStorageOperation,
  createTransferOperation,
  createTransferTicketOperation,
  WalletDelegateParams,
  WalletOriginateParams,
  WalletIncreasePaidStorageParams,
  WalletTransferParams,
  WalletStakeParams,
  WalletUnstakeParams,
  WalletFinalizeUnstakeParams,
  WalletTransferTicketParams,
  Signer,
  TezosToolkit
} from '@taquito/taquito';
import { Tzip16Module } from '@taquito/tzip16';
import { buf2hex } from '@taquito/utils';
import memoizee from 'memoizee';
import { nanoid } from 'nanoid';
import toBuffer from 'typedarray-to-buffer';

import { TempleMessageType } from 'lib/temple/types';
import { makeIntercomRequest, assertResponse, getAccountPublicKey } from 'temple/front/intercom-client';
import { MAX_MEMOIZED_TOOLKITS } from 'temple/misc';
import { getTezosFastRpcClient, makeTezosClientId, michelEncoder } from 'temple/tezos';

import { setPendingConfirmationId } from '../pending-confirm';

export { validateTezosContractAddress } from './helpers';
export { useOnTezosBlock, useTezosBlockLevel } from './use-block';
export { isTezosDomainsNameValid, getTezosDomainsClient, useTezosAddressByDomainName } from './tzdns';

export const getTezosToolkitWithSigner = memoizee(
  (rpcUrl: string, signerPkh: string, straightaway?: boolean) => {
    const tezos = new ReactiveTezosToolkit(rpcUrl, signerPkh);

    const wallet = new TempleTaquitoWallet(signerPkh, rpcUrl, setPendingConfirmationId, straightaway);
    tezos.setWalletProvider(wallet);

    // TODO: Do we need signer, if wallet is provided ?
    // Note: Taquito's WalletProvider already has `sign()` method - just need to implement it ?

    const signer = new TempleTaquitoSigner(signerPkh, rpcUrl, setPendingConfirmationId);
    tezos.setSignerProvider(signer);

    return tezos;
  },
  {
    max: MAX_MEMOIZED_TOOLKITS,
    normalizer: ([rpcUrl, signerPkh, straightaway]) => makeTezosClientId(rpcUrl, signerPkh, straightaway)
  }
);

class ReactiveTezosToolkit extends TezosToolkit {
  clientId: string;

  constructor(rpcUrl: string, accountPkh: string) {
    super(getTezosFastRpcClient(rpcUrl));

    this.clientId = makeTezosClientId(rpcUrl, accountPkh);

    this.setPackerProvider(michelEncoder);
    this.addExtension(new Tzip16Module());
  }
}

class TempleTaquitoWallet implements WalletProvider {
  constructor(
    private pkh: string,
    private rpc: string,
    private onBeforeSend?: (id: string) => void,
    private straightaway?: boolean
  ) {}

  async getPKH() {
    return this.pkh;
  }

  getPK() {
    return getAccountPublicKey(this.pkh);
  }

  async mapTransferTicketParamsToWalletParams(params: () => Promise<WalletTransferTicketParams>) {
    const walletParams = await params();
    return withoutFeesOverride(walletParams, await createTransferTicketOperation(walletParams));
  }

  async mapIncreasePaidStorageWalletParams(params: () => Promise<WalletIncreasePaidStorageParams>) {
    const walletParams = await params();
    return withoutFeesOverride(walletParams, await createIncreasePaidStorageOperation(walletParams));
  }

  async mapTransferParamsToWalletParams(params: () => Promise<WalletTransferParams>) {
    const walletParams = await params();
    return withoutFeesOverride(walletParams, await createTransferOperation(walletParams));
  }

  async mapOriginateParamsToWalletParams(params: () => Promise<WalletOriginateParams>) {
    const walletParams = await params();
    return withoutFeesOverride(walletParams, await createOriginationOperation(walletParams));
  }

  async mapDelegateParamsToWalletParams(params: () => Promise<WalletDelegateParams>) {
    const walletParams = await params();
    return withoutFeesOverride(walletParams, await createSetDelegateOperation(walletParams as any));
  }

  async mapStakeParamsToWalletParams(params: () => Promise<WalletStakeParams>) {
    const walletParams = await params();
    return withoutFeesOverride(walletParams, await createTransferOperation(walletParams as any));
  }

  async mapUnstakeParamsToWalletParams(params: () => Promise<WalletUnstakeParams>) {
    const walletParams = await params();
    return withoutFeesOverride(walletParams, await createTransferOperation(walletParams as any));
  }

  async mapFinalizeUnstakeParamsToWalletParams(params: () => Promise<WalletFinalizeUnstakeParams>) {
    const walletParams = await params();
    return withoutFeesOverride(walletParams, await createTransferOperation(walletParams as any));
  }

  async sendOperations(opParams: any[]) {
    const id = nanoid();
    if (this.onBeforeSend) {
      this.onBeforeSend(id);
    }
    const res = await makeIntercomRequest({
      type: TempleMessageType.OperationsRequest,
      id,
      sourcePkh: this.pkh,
      networkRpc: this.rpc,
      opParams: opParams.map(formatOpParams),
      straightaway: this.straightaway
    });
    assertResponse(res.type === TempleMessageType.OperationsResponse);

    return res.opHash;
  }

  async sign(): Promise<string> {
    console.warn('TempleTaquitoWallet.sign(): Tried to sign. Will throw');

    throw new Error('Cannot sign');
  }
}

function formatOpParams(op: any) {
  switch (op.kind) {
    case 'origination':
      return {
        ...op,
        mutez: true // The balance was already converted from Tez (ꜩ) to Mutez (uꜩ)
      };
    case 'transaction':
      const { destination, amount, parameters, ...txRest } = op;
      return {
        ...txRest,
        to: destination,
        amount: +amount,
        mutez: true,
        parameter: parameters
      };
    default:
      return op;
  }
}

function withoutFeesOverride<T>(params: any, op: T): T {
  try {
    const { fee, gasLimit, storageLimit } = params;
    return {
      ...op,
      fee,
      gas_limit: gasLimit,
      storage_limit: storageLimit
    };
  } catch {
    return params;
  }
}

class TempleTaquitoSigner implements Signer {
  constructor(private pkh: string, private rpc: string, private onBeforeSign?: (id: string) => void) {}

  async publicKeyHash() {
    return this.pkh;
  }

  async publicKey(): Promise<string> {
    return getAccountPublicKey(this.pkh);
  }

  async secretKey(): Promise<string> {
    throw new Error('Secret key cannot be exposed');
  }

  async sign(bytes: string, watermark?: Uint8Array) {
    const id = nanoid();
    if (this.onBeforeSign) {
      this.onBeforeSign(id);
    }
    const res = await makeIntercomRequest({
      type: TempleMessageType.SignRequest,
      sourcePkh: this.pkh,
      networkRpc: this.rpc,
      id,
      bytes,
      watermark: watermark ? buf2hex(toBuffer(watermark)) : undefined
    });
    assertResponse(res.type === TempleMessageType.SignResponse);
    return res.result;
  }
}
