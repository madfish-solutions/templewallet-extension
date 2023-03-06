import { ChainIds, TezosToolkit } from '@taquito/taquito';
import BigNumber from 'bignumber.js';

import { loadContract } from 'lib/temple/contract';

import { TEZOS_METADATA, AssetMetadata } from '../metadata';
import { fromAssetSlug, isFA2Token } from './utils';

export async function fetchTezosBalanceAtomic(tezos: TezosToolkit, account: string) {
  let nat = (await getBalanceSafe(tezos, account)) ?? new BigNumber(0);
  nat = toSafeBignum(nat);

  return nat;
}

export async function fetchTezosBalance(tezos: TezosToolkit, account: string) {
  const nat = await fetchTezosBalanceAtomic(tezos, account);

  return nat.div(10 ** TEZOS_METADATA.decimals);
}

export async function fetchBalance(
  tezos: TezosToolkit,
  assetSlug: string,
  account: string,
  assetMetadata?: Pick<AssetMetadata, 'decimals'> | null
) {
  const asset = await fromAssetSlug(tezos, assetSlug);

  if (asset === 'tez') return await fetchTezosBalance(tezos, account);

  let nat = new BigNumber(0);

  const contract = await loadContract(tezos, asset.contract, false);
  const chainId = (await tezos.rpc.getChainId()) as ChainIds;

  if (isFA2Token(asset)) {
    try {
      const response = await contract.views.balance_of([{ owner: account, token_id: asset.id }]).read(chainId);
      nat = response[0].balance;
    } catch {}
  } else {
    try {
      nat = await contract.views.getBalance(account).read(chainId);
    } catch {}
  }

  nat = toSafeBignum(nat);

  return assetMetadata ? nat.div(10 ** assetMetadata.decimals) : nat;
}

const getBalanceSafe = async (tezos: TezosToolkit, account: string) => {
  try {
    return await tezos.tz.getBalance(account);
  } catch {}
  return;
};

const toSafeBignum = (x: any): BigNumber =>
  !x || (typeof x === 'object' && typeof x.isNaN === 'function' && x.isNaN()) ? new BigNumber(0) : new BigNumber(x);
