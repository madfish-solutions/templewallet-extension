import { useMemo } from 'react';

import { isEqual } from 'lodash';

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
import { useMemoWithCompare } from 'lib/ui/hooks';
import { useEnabledEvmChains, useEnabledTezosChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { EMPTY_FROZEN_OBJ } from '../../utils';
import type { AccountAsset } from '../types';
import { toChainAssetSlug } from '../utils';

import { getAssetStatus } from './utils';

interface AccountCollectible extends AccountAsset {
  chainId: string | number;
}

const useTezosAccountCollectibles = (account: string) => {
  const enabledChains = useEnabledTezosChains();
  const storedRecord = useAllCollectiblesSelector();
  const balancesRecord = useBalancesAtomicRecordSelector();

  return useMemoWithCompare<AccountCollectible[]>(
    () => {
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

      return accountCollectibles;
    },
    [enabledChains, account, storedRecord, balancesRecord],
    (prev, next) => {
      if (prev.length !== next.length) return false;

      return next.every((item, i) => {
        const prevItem = prev[i]!;
        return item.slug === prevItem.slug && item.status === prevItem.status && item.chainId === prevItem.chainId;
      });
    }
  );
};

export const useEnabledAccountChainCollectiblesSlugs = (accountTezAddress: string, accountEvmAddress: HexString) => {
  const tezCollectibles = useTezosAccountCollectibles(accountTezAddress);
  const evmCollectilbes = useEvmAccountCollectibles(accountEvmAddress);

  return useMemo(
    () => [
      ...tezCollectibles.reduce<string[]>(
        (acc, { slug, status, chainId }) =>
          status === 'enabled' ? acc.concat(toChainAssetSlug(TempleChainKind.Tezos, chainId, slug)) : acc,
        []
      ),
      ...evmCollectilbes.reduce<string[]>(
        (acc, { slug, status, chainId }) =>
          status === 'enabled' ? acc.concat(toChainAssetSlug(TempleChainKind.EVM, chainId, slug)) : acc,
        []
      )
    ],
    [tezCollectibles, evmCollectilbes]
  );
};

export const useAllAccountChainCollectiblesSlugs = (accountTezAddress: string, accountEvmAddress: HexString) => {
  const tezCollectibles = useTezosAccountCollectibles(accountTezAddress);
  const evmCollectilbes = useEvmAccountCollectibles(accountEvmAddress);

  return useMemo(
    () => [
      ...tezCollectibles.reduce<string[]>(
        (acc, { slug, status, chainId }) =>
          status !== 'removed' ? acc.concat(toChainAssetSlug(TempleChainKind.Tezos, chainId, slug)) : acc,
        []
      ),
      ...evmCollectilbes.reduce<string[]>(
        (acc, { slug, status, chainId }) =>
          status !== 'removed' ? acc.concat(toChainAssetSlug(TempleChainKind.EVM, chainId, slug)) : acc,
        []
      )
    ],
    [tezCollectibles, evmCollectilbes]
  );
};

export const useTezosChainAccountCollectibles = (account: string, chainId: string) => {
  const stored = useChainAccountCollectiblesSelector(account, chainId);

  const balances = useAllAccountBalancesSelector(account, chainId);

  return useMemoWithCompare<AccountCollectible[]>(
    () => {
      const result: AccountCollectible[] = [];

      for (const [slug, { status }] of Object.entries(stored)) {
        if (status !== 'removed') result.push({ slug, status: getAssetStatus(balances[slug], status), chainId });
      }

      return result;
    },
    [stored, balances, chainId],
    (prev, next) => {
      if (prev.length !== next.length) return false;

      return next.every((item, i) => {
        const prevItem = prev[i]!;
        return item.slug === prevItem.slug && item.status === prevItem.status;
      });
    }
  );
};

export const useEnabledTezosAccountCollectiblesSlugs = (publicKeyHash: string) => {
  const collectibles = useTezosAccountCollectibles(publicKeyHash);

  return useMemo(
    () =>
      collectibles.reduce<string[]>(
        (acc, { slug, status, chainId }) =>
          status === 'enabled' ? acc.concat(toChainAssetSlug(TempleChainKind.Tezos, chainId, slug)) : acc,
        []
      ),
    [collectibles]
  );
};

export const useAllTezosAccountCollectiblesSlugs = (publicKeyHash: string) => {
  const collectibles = useTezosAccountCollectibles(publicKeyHash);

  return useMemo(
    () =>
      collectibles.reduce<string[]>(
        (acc, { slug, status, chainId }) =>
          status !== 'removed' ? acc.concat(toChainAssetSlug(TempleChainKind.Tezos, chainId, slug)) : acc,
        []
      ),
    [collectibles]
  );
};

export const useEnabledTezosChainAccountCollectiblesSlugs = (publicKeyHash: string, chainId: string) => {
  const collectibles = useTezosChainAccountCollectibles(publicKeyHash, chainId);

  return useMemo(
    () => collectibles.reduce<string[]>((acc, { slug, status }) => (status === 'enabled' ? acc.concat(slug) : acc), []),
    [collectibles]
  );
};

export const useAllTezosChainAccountCollectiblesSlugs = (publicKeyHash: string, chainId: string) => {
  const collectibles = useTezosChainAccountCollectibles(publicKeyHash, chainId);

  return useMemo(
    () => collectibles.reduce<string[]>((acc, { slug, status }) => (status !== 'removed' ? acc.concat(slug) : acc), []),
    [collectibles]
  );
};

const useEvmAccountCollectibles = (account: HexString) => {
  const enabledChains = useEnabledEvmChains();

  const collectiblesRecord = useRawEvmAccountCollectiblesSelector(account);
  const balancesRecord = useRawEvmAccountBalancesSelector(account);

  return useMemoWithCompare<AccountCollectible[]>(
    () => {
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

      return accountCollectibles;
    },
    [enabledChains, collectiblesRecord, balancesRecord],
    isEqual
  );
};

const useEvmChainAccountCollectibles = (account: HexString, chainId: number) => {
  const stored = useRawEvmChainAccountCollectiblesSelector(account, chainId);
  const balances = useRawEvmChainAccountBalancesSelector(account, chainId);

  return useMemoWithCompare<AccountCollectible[]>(
    () => {
      const result: AccountCollectible[] = [];

      for (const [slug, { status }] of Object.entries(stored)) {
        if (status !== 'removed') result.push({ slug, status: getAssetStatus(balances[slug], status), chainId });
      }

      return result;
    },
    [stored, balances, chainId],
    (prev, next) => {
      if (prev.length !== next.length) return false;

      return next.every((item, i) => {
        const prevItem = prev[i]!;
        return item.slug === prevItem.slug && item.status === prevItem.status && item.chainId === prevItem.chainId;
      });
    }
  );
};

export const useEnabledEvmAccountCollectiblesSlugs = (publicKeyHash: HexString) => {
  const collectibles = useEvmAccountCollectibles(publicKeyHash);

  return useMemo(
    () =>
      collectibles.reduce<string[]>(
        (acc, { slug, status, chainId }) =>
          status === 'enabled' ? acc.concat(toChainAssetSlug(TempleChainKind.EVM, chainId, slug)) : acc,
        []
      ),
    [collectibles]
  );
};

export const useAllEvmAccountCollectiblesSlugs = (publicKeyHash: HexString) => {
  const collectibles = useEvmAccountCollectibles(publicKeyHash);

  return useMemo(
    () =>
      collectibles.reduce<string[]>(
        (acc, { slug, status, chainId }) =>
          status !== 'removed' ? acc.concat(toChainAssetSlug(TempleChainKind.EVM, chainId, slug)) : acc,
        []
      ),
    [collectibles]
  );
};

export const useEnabledEvmChainAccountCollectiblesSlugs = (publicKeyHash: HexString, evmChainId: number) => {
  const collectibles = useEvmChainAccountCollectibles(publicKeyHash, evmChainId);

  return useMemo(
    () => collectibles.reduce<string[]>((acc, { slug, status }) => (status === 'enabled' ? acc.concat(slug) : acc), []),
    [collectibles]
  );
};

export const useAllEvmChainAccountCollectiblesSlugs = (publicKeyHash: HexString, evmChainId: number) => {
  const collectibles = useEvmChainAccountCollectibles(publicKeyHash, evmChainId);

  return useMemo(
    () => collectibles.reduce<string[]>((acc, { slug, status }) => (status !== 'removed' ? acc.concat(slug) : acc), []),
    [collectibles]
  );
};
