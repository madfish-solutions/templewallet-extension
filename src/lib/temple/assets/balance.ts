import { ChainIds, TezosToolkit } from '@taquito/taquito';
import BigNumber from 'bignumber.js';

import { loadContract } from 'lib/temple/front';

import { AssetMetadata, TEZOS_METADATA } from '../metadata';
import { fromAssetSlug, isFA2Token } from './utils';

export function fetchTezosBalance(tezos: TezosToolkit, account: string) {
  return fetchBalance(tezos, 'tez', TEZOS_METADATA, account);
}

export async function fetchBalance(
  tezos: TezosToolkit,
  assetSlug: string,
  assetMetadata: Pick<AssetMetadata, 'decimals'> | null = TEZOS_METADATA,
  account: string
) {
  const asset = await fromAssetSlug(tezos, assetSlug);

  const nat = new BigNumber(0);

  if (asset === 'tez') {
    const safeBalance = await getBalanceSafe(tezos, account);
    nat.plus(safeBalance ?? new BigNumber(0));
  } else {
    const contract = await loadContract(tezos, asset.contract, false);
    const chainId = (await tezos.rpc.getChainId()) as ChainIds;

    if (isFA2Token(asset)) {
      try {
        const response = await contract.views.balance_of([{ owner: account, token_id: asset.id }]).read(chainId);
        const accountBalance = response[0].balance;
        nat.plus(getSafeBignum(accountBalance));
      } catch {}
    } else {
      try {
        const accountBalance = await contract.views.getBalance(account).read(chainId);
        nat.plus(getSafeBignum(accountBalance));
      } catch {}
    }
  }

  return assetMetadata ? nat.div(10 ** assetMetadata.decimals) : nat;
}

const getBalanceSafe = async (tezos: TezosToolkit, account: string) => {
  try {
    return await tezos.tz.getBalance(account);
  } catch {}
  return undefined;
};

const getSafeBignum = (x: any): BigNumber => (!x || x.isNaN() ? new BigNumber(0) : new BigNumber(x));
