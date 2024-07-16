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
    isEqual
  );
};

export const useEnabledAccountChainCollectiblesSlugs = (accountTezAddress: string, accountEvmAddress: HexString) => {
  const tezCollectibles = useEnabledTezosAccountCollectiblesSlugs(accountTezAddress);
  const evmCollectibles = useEnabledEvmAccountCollectiblesSlugs(accountEvmAddress);

  return useMemo(() => [...tezCollectibles, ...evmCollectibles], [tezCollectibles, evmCollectibles]);
};

export const useAllAccountChainCollectiblesSlugs = (accountTezAddress: string, accountEvmAddress: HexString) => {
  const tezCollectibles = useAllTezosAccountCollectiblesSlugs(accountTezAddress);
  const evmCollectibles = useAllEvmAccountCollectiblesSlugs(accountEvmAddress);

  return useMemo(() => [...tezCollectibles, ...evmCollectibles], [tezCollectibles, evmCollectibles]);
};

const useTezosChainAccountCollectibles = (account: string, chainId: string) => {
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
    isEqual
  );
};

export const useEnabledTezosAccountCollectiblesSlugs = (publicKeyHash: string) => {
  const collectibles = useTezosAccountCollectibles(publicKeyHash);

  return useMemo(
    () =>
      collectibles.reduce<string[]>((acc, { slug, status, chainId }) => {
        if (status === 'enabled') acc.push(toChainAssetSlug(TempleChainKind.Tezos, chainId, slug));

        return acc;
      }, []),
    [collectibles]
  );
};

export const useAllTezosAccountCollectiblesSlugs = (publicKeyHash: string) => {
  const collectibles = useTezosAccountCollectibles(publicKeyHash);

  return useMemo(
    () =>
      collectibles.reduce<string[]>((acc, { slug, status, chainId }) => {
        if (status !== 'removed') acc.push(toChainAssetSlug(TempleChainKind.Tezos, chainId, slug));

        return acc;
      }, []),
    [collectibles]
  );
};

export const useEnabledTezosChainAccountCollectiblesSlugs = (publicKeyHash: string, chainId: string) => {
  const collectibles = useTezosChainAccountCollectibles(publicKeyHash, chainId);

  return useMemo(
    () =>
      collectibles.reduce<string[]>((acc, { slug, status }) => {
        if (status === 'enabled') acc.push(slug);

        return acc;
      }, []),
    [collectibles]
  );
};

export const useAllTezosChainAccountCollectiblesSlugs = (publicKeyHash: string, chainId: string) => {
  const collectibles = useTezosChainAccountCollectibles(publicKeyHash, chainId);

  return useMemo(
    () =>
      collectibles.reduce<string[]>((acc, { slug, status }) => {
        if (status !== 'removed') acc.push(slug);

        return acc;
      }, []),
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
    isEqual
  );
};

export const useEnabledEvmAccountCollectiblesSlugs = (publicKeyHash: HexString) => {
  const collectibles = useEvmAccountCollectibles(publicKeyHash);

  return useMemo(
    () =>
      collectibles.reduce<string[]>((acc, { slug, status, chainId }) => {
        if (status === 'enabled') acc.push(toChainAssetSlug(TempleChainKind.EVM, chainId, slug));

        return acc;
      }, []),
    [collectibles]
  );
};

export const useAllEvmAccountCollectiblesSlugs = (publicKeyHash: HexString) => {
  const collectibles = useEvmAccountCollectibles(publicKeyHash);

  return useMemo(
    () =>
      collectibles.reduce<string[]>((acc, { slug, status, chainId }) => {
        if (status !== 'removed') acc.push(toChainAssetSlug(TempleChainKind.EVM, chainId, slug));

        return acc;
      }, []),
    [collectibles]
  );
};

export const useEnabledEvmChainAccountCollectiblesSlugs = (publicKeyHash: HexString, evmChainId: number) => {
  const collectibles = useEvmChainAccountCollectibles(publicKeyHash, evmChainId);

  return useMemo(
    () =>
      collectibles.reduce<string[]>((acc, { slug, status }) => {
        if (status === 'enabled') acc.push(slug);

        return acc;
      }, []),
    [collectibles]
  );
};

export const useAllEvmChainAccountCollectiblesSlugs = (publicKeyHash: HexString, evmChainId: number) => {
  const collectibles = useEvmChainAccountCollectibles(publicKeyHash, evmChainId);

  return useMemo(
    () =>
      collectibles.reduce<string[]>((acc, { slug, status }) => {
        if (status !== 'removed') acc.push(slug);

        return acc;
      }, []),
    [collectibles]
  );
};
