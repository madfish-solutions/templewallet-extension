import { TezosToolkit } from '@taquito/taquito';
import BigNumber from 'bignumber.js';

import { loadContractForCallLambdaView } from 'lib/temple/front';

import { AssetMetadata, TEZOS_METADATA } from '../metadata';
import { fromAssetSlug, isFA2Token } from './utils';

export function fetchTezosBalance(tezos: TezosToolkit, account: string) {
  return fetchBalance(tezos, 'tez', TEZOS_METADATA, account);
}

export async function fetchBalance(
  tezos: TezosToolkit,
  assetSlug: string,
  assetMetadata: Pick<AssetMetadata, 'decimals'> | null,
  account: string
) {
  const asset = await fromAssetSlug(tezos, assetSlug);

  let nat: BigNumber | undefined;

  if (asset === 'tez') {
    try {
      nat = await tezos.tz.getBalance(account);
    } catch {}
  } else {
    const contract = await loadContractForCallLambdaView(tezos, asset.contract);

    if (isFA2Token(asset)) {
      try {
        const response = await contract.views
          .balance_of([{ owner: account, token_id: asset.id }])
          .read((tezos as any).lambdaContract);
        nat = response[0].balance;
      } catch {}
    } else {
      try {
        nat = await contract.views.getBalance(account).read((tezos as any).lambdaContract);
      } catch {}
    }
  }

  if (!nat || nat.isNaN()) {
    nat = new BigNumber(0);
  }

  return assetMetadata ? nat.div(10 ** assetMetadata.decimals) : nat;
}
