import { useMemo } from 'react';

import {
  useRawEvmAccountCollectiblesSelector,
  useRawEvmChainAccountCollectiblesSelector
} from 'app/store/evm/assets/selectors';
import {
  useRawEvmAccountBalancesSelector,
  useRawEvmChainAccountBalancesSelector
} from 'app/store/evm/balances/selectors';
import { useChainAccountCollectiblesSelector, useAllCollectiblesSelector } from 'app/store/tezos/assets/selectors';
import { getAccountAssetsStoreKey } from 'app/store/tezos/assets/utils';
import { useAllAccountBalancesSelector, useBalancesAtomicRecordSelector } from 'app/store/tezos/balances/selectors';
import { getKeyForBalancesRecord } from 'app/store/tezos/balances/utils';
import type { AccountAsset } from 'lib/assets/types';
import { EMPTY_FROZEN_OBJ } from 'lib/utils';
import { useEnabledEvmChains, useEnabledTezosChains } from 'temple/front';

import { getAssetStatus } from './utils';

interface AccountCollectible extends AccountAsset {
  chainId: string | number;
}

export const useTezosAccountCollectibles = (account: string) => {
  const enabledChains = useEnabledTezosChains();
  const storedRecord = useAllCollectiblesSelector();
  const balancesRecord = useBalancesAtomicRecordSelector();

  return useMemo<AccountCollectible[]>(() => {
    let accountCollectibles: AccountCollectible[] = [];

    for (const chain of enabledChains) {
      const chainId = chain.chainId;

      const assetsKey = getAccountAssetsStoreKey(account, chainId);
      const balancesKey = getKeyForBalancesRecord(account, chainId);

      const storedRaw = storedRecord[assetsKey] ?? EMPTY_FROZEN_OBJ;
      const balances = balancesRecord[balancesKey]?.data ?? EMPTY_FROZEN_OBJ;

      accountCollectibles = accountCollectibles.concat(
        Object.entries(storedRaw).map<AccountCollectible>(([slug, { status }]) => ({
          slug,
          status: getAssetStatus(balances[slug], status),
          chainId
        }))
      );
    }

    return accountCollectibles.filter(c => c.status !== 'removed');
  }, [enabledChains, account, storedRecord, balancesRecord]);
};

/**
 * @returns Collectibes of account for chain, that were not removed
 */
export const useTezosChainAccountCollectibles = (account: string, chainId: string) => {
  const stored = useChainAccountCollectiblesSelector(account, chainId);

  const balances = useAllAccountBalancesSelector(account, chainId);

  return useMemo(
    () =>
      Object.entries(stored)
        .filter(([, asset]) => asset.status !== 'removed')
        .map<AccountCollectible>(([slug, { status }]) => ({
          slug,
          status: getAssetStatus(balances[slug], status),
          chainId
        })),
    [stored, balances, chainId]
  );
};

/**
 * @returns Collectibes of account for all chains, that were not removed
 */
export const useEvmAccountCollectibles = (account: HexString) => {
  const enabledChains = useEnabledEvmChains();

  const collectiblesRecord = useRawEvmAccountCollectiblesSelector(account);
  const balancesRecord = useRawEvmAccountBalancesSelector(account);

  return useMemo<AccountCollectible[]>(() => {
    let accountCollectibles: AccountCollectible[] = [];

    for (const chain of enabledChains) {
      const chainId = chain.chainId;

      const chainTokensRecord = collectiblesRecord[chainId];

      if (!chainTokensRecord) continue;

      accountCollectibles = accountCollectibles.concat(
        Object.entries(chainTokensRecord).map<AccountCollectible>(([slug, { status }]) => ({
          slug,
          status: getAssetStatus(balancesRecord[chainId]?.[slug], status),
          chainId
        }))
      );
    }

    return accountCollectibles.filter(c => c.status !== 'removed');
  }, [enabledChains, collectiblesRecord, balancesRecord]);
};

/**
 * @returns Collectibes of account for chain, that were not removed
 */
export const useEvmChainAccountCollectibles = (account: HexString, chainId: number) => {
  const stored = useRawEvmChainAccountCollectiblesSelector(account, chainId);
  const balances = useRawEvmChainAccountBalancesSelector(account, chainId);

  return useMemo(
    () =>
      Object.entries(stored)
        .filter(([, asset]) => asset.status !== 'removed')
        .map<AccountCollectible>(([slug, { status }]) => ({
          slug,
          status: getAssetStatus(balances[slug], status),
          chainId
        })),
    [stored, balances, chainId]
  );
};
