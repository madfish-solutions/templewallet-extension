import { TezosToolkit, WalletContract } from '@taquito/taquito';
import memoize from 'micro-memoize';

import { michelEncoder } from 'lib/temple/helpers';
import { TempleChainId } from 'lib/temple/types';

const KNOWN_CHAIN_IDS = Object.values(TempleChainId) as string[];

export const loadContract = memoize(fetchContract, {
  isPromise: true,
  maxSize: 100
});

export function fetchContract(tezos: TezosToolkit, address: string, walletAPI = true): Promise<WalletContract> {
  return walletAPI ? tezos.wallet.at(address) : (tezos.contract.at(address) as any);
}

export async function loadContractForCallLambdaView(tezos: TezosToolkit, contractAddress: string) {
  const chainId = await tezos.rpc.getChainId();
  if (KNOWN_CHAIN_IDS.includes(chainId)) {
    tezos = new TezosToolkit(tezos.rpc);
    tezos.setSignerProvider(lambdaSigner);
    tezos.setPackerProvider(michelEncoder);
  }

  const contract: any = await loadContract(tezos, contractAddress, false);
  return contract;
}

class LambdaViewSigner {
  async publicKeyHash() {
    return process.env.TEMPLE_WALLET_LV_ACCOUNT_PKH!;
  }

  async publicKey() {
    return process.env.TEMPLE_WALLET_LV_ACCOUNT_PUBLIC_KEY!;
  }

  async secretKey(): Promise<string> {
    throw new Error('Secret key cannot be exposed');
  }

  async sign(): Promise<{
    bytes: string;
    sig: string;
    prefixSig: string;
    sbytes: string;
  }> {
    throw new Error('Cannot sign');
  }
}

if (!process.env.TEMPLE_WALLET_LV_ACCOUNT_PKH || !process.env.TEMPLE_WALLET_LV_ACCOUNT_PUBLIC_KEY) {
  throw new Error(
    "Require a 'TEMPLE_WALLET_LV_ACCOUNT_PKH' and " +
      "'TEMPLE_WALLET_LV_ACCOUNT_PUBLIC_KEY' environment variable to be set"
  );
}

const lambdaSigner = new LambdaViewSigner();
