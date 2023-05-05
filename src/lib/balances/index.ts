import { ChainIds, TezosToolkit } from '@taquito/taquito';
import BigNumber from 'bignumber.js';

import { isFA2Token, TEZ_TOKEN_SLUG } from 'lib/assets';
import { fromAssetSlug } from 'lib/assets/utils';
import { TEZOS_METADATA, AssetMetadataBase } from 'lib/metadata';
import { loadContract } from 'lib/temple/contract';
import { atomsToTokens } from 'lib/temple/helpers';

export const getKeyForBalancesRecord = (publiKeyHash: string, chainId: string) => `${publiKeyHash}_${chainId}`;

export const fetchTezosBalanceAtomic = async (tezos: TezosToolkit, account: string) => {
  let nat = (await getBalanceSafe(tezos, account)) ?? new BigNumber(0);
  nat = toSafeBignum(nat);

  return nat;
};

export const fetchTezosBalance = async (tezos: TezosToolkit, account: string) => {
  const nat = await fetchTezosBalanceAtomic(tezos, account);

  return atomsToTokens(nat, TEZOS_METADATA.decimals);
};

export const fetchBalance = async (
  tezos: TezosToolkit,
  assetSlug: string,
  account: string,
  assetMetadata: Pick<AssetMetadataBase, 'decimals'>
) => {
  const atomicBalance = await fetchBalanceAtomic(tezos, assetSlug, account);

  return atomsToTokens(atomicBalance, assetMetadata.decimals);
};

export const fetchBalanceAtomic = async (tezos: TezosToolkit, assetSlug: string, account: string) => {
  const asset = await fromAssetSlug(tezos, assetSlug);

  if (asset === TEZ_TOKEN_SLUG) return await fetchTezosBalanceAtomic(tezos, account);

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

  return toSafeBignum(nat);
};

const getBalanceSafe = async (tezos: TezosToolkit, account: string) => {
  try {
    return await tezos.tz.getBalance(account);
  } catch {}
  return;
};

const toSafeBignum = (x: any): BigNumber =>
  !x || (typeof x === 'object' && typeof x.isNaN === 'function' && x.isNaN()) ? new BigNumber(0) : new BigNumber(x);
