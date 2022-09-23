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

  let nat: BigNumber | undefined;

  if (asset === 'tez') {
    nat = await getBalanceSafe(tezos, account);
  } else {
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
  }

  if (!nat || nat.isNaN()) {
    nat = new BigNumber(0);
  }

  return assetMetadata ? nat.div(10 ** assetMetadata.decimals) : nat;
}

const getBalanceSafe = async (tezos: TezosToolkit, account: string) => {
  try {
    return await tezos.tz.getBalance(account);
  } catch {}
  return undefined;
};
