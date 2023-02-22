import { ChainIds, TezosToolkit } from '@taquito/taquito';
import BigNumber from 'bignumber.js';

import { TzktAccountToken } from 'lib/apis/tzkt';
import { TzktAccountInfo } from 'lib/apis/tzkt/types';
import { loadContract } from 'lib/temple/contract';
import { atomsToTokens } from 'lib/temple/helpers';

import { TEZOS_METADATA, AssetMetadata } from '../metadata';
import { fromAssetSlug, isFA2Token, toTokenSlug } from './utils';

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

export const fetchBalanceFromTzkt = async (
  apiUrl: string,
  publicKeyHash: string,
  tokensBaseMetadata: Record<string, AssetMetadata>
) => {
  const [accountInfoResponse, tokenBalancesResponse] = await Promise.all([
    fetch(`${apiUrl}/v1/accounts/${publicKeyHash}`),
    fetch(`${apiUrl}/v1/tokens/balances?account=${publicKeyHash}&limit=10000`)
  ]);

  const [accountInfo, tokenBalances]: [TzktAccountInfo, Array<TzktAccountToken>] = await Promise.all([
    accountInfoResponse.json(),
    tokenBalancesResponse.json()
  ]);

  const result: Record<string, BigNumber> = {
    tez: new BigNumber(accountInfo.balance).minus(accountInfo.frozenDeposit ?? 0).div(10 ** TEZOS_METADATA.decimals)
  };

  tokenBalances.forEach(item => {
    const value = new BigNumber(item.balance);
    const slug = toTokenSlug(item.token.contract.address, item.token.tokenId);
    const decimals = tokensBaseMetadata[slug]?.decimals ?? Number(item.token.metadata?.decimals);

    result[slug] = atomsToTokens(value, decimals);
  });

  return result;
};
