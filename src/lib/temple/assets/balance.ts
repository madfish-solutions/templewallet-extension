import { ChainIds, TezosToolkit } from '@taquito/taquito';
import BigNumber from 'bignumber.js';

import { TzktAccountToken } from 'lib/apis/tzkt';
import { loadContract } from 'lib/temple/contract';

import { TEZOS_METADATA } from '../metadata/defaults';
import { AssetMetadata } from '../metadata/types';
import { fromAssetSlug, isFA2Token } from './utils';

export async function fetchTezosBalance(tezos: TezosToolkit, account: string) {
  let nat = (await getBalanceSafe(tezos, account)) ?? new BigNumber(0);
  nat = toSafeBignum(nat);

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

export const fetchBalanceFromTzkt = async (apiUrl: string, publicKeyHash: string) => {
  const [tezBalanceResponse, tokenBalancesResponse] = await Promise.all([
    fetch(`${apiUrl}/v1/accounts/${publicKeyHash}/balance`),
    fetch(`${apiUrl}/v1/tokens/balances?account=${publicKeyHash}`)
  ]);

  const [tezBalance, tokenBalances]: [number, Array<TzktAccountToken>] = await Promise.all([
    tezBalanceResponse.json(),
    tokenBalancesResponse.json()
  ]);

  const result: Record<string, BigNumber> = { tez: new BigNumber(tezBalance).div(10 ** TEZOS_METADATA.decimals) };

  tokenBalances.forEach(item => {
    const value = new BigNumber(item.balance);
    result[`${item.token.contract.address}_${item.token.tokenId}`] = value.div(
      10 ** parseInt(item.token.metadata?.decimals ?? '0')
    );
  });

  return result;
};
