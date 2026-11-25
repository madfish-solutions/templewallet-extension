import { useCallback, useState } from 'react';

import { isDefined } from '@rnw-community/shared';
import { BigNumber } from 'bignumber.js';
import { identity } from 'lodash';

import { useTezosUsdToTokenRatesSelector } from 'app/store/currency/selectors';
import {
  useRawEvmAccountBalancesSelector,
  useRawEvmChainAccountBalancesSelector
} from 'app/store/evm/balances/selectors';
import {
  useEvmChainUsdToTokenRatesSelector,
  useEvmUsdToTokenRatesSelector
} from 'app/store/evm/tokens-exchange-rates/selectors';
import { useAllAccountBalancesSelector, useBalancesAtomicRecordSelector } from 'app/store/tezos/balances/selectors';
import { getKeyForBalancesRecord } from 'app/store/tezos/balances/utils';
import { useGetChainTokenOrGasMetadata, useGetEvmGasOrTokenMetadata, useGetTokenOrGasMetadata } from 'lib/metadata';
import { atomsToTokens } from 'lib/temple/helpers';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { useUpdatableRef } from 'lib/ui/hooks';
import { ZERO } from 'lib/utils/numbers';
import { useFavoriteTokens } from 'temple/front/use-favorite-tokens';
import { TempleChainKind } from 'temple/types';

import { type ParseChainReturnType, parseChainAssetSlug, toChainAssetSlug } from './utils';

interface TokenSortKey {
  rawBalance: string | undefined;
  decimals: number | undefined;
  rate: BigNumber.Value | undefined;
  balance: BigNumber;
  equity: BigNumber;
}

const useTokenSortKeyGetter = () => {
  const [cache] = useState(() => new Map<string, TokenSortKey>());

  return useCallback(
    (
      slug: string,
      rawBalance: string | undefined,
      decimals: number | undefined,
      rate: BigNumber.Value | undefined
    ): TokenSortKey => {
      const cached = cache.get(slug);

      if (cached && cached.rawBalance === rawBalance && cached.decimals === decimals && cached.rate === rate) {
        return cached;
      }

      const balance = rawBalance && isDefined(decimals) ? atomsToTokens(rawBalance, decimals) : ZERO;
      const key: TokenSortKey = { rawBalance, decimals, rate, balance, equity: balance.multipliedBy(rate ?? ZERO) };

      cache.set(slug, key);

      return key;
    },
    [cache]
  );
};

const useCollectibleBalanceGetter = () => {
  const [cache] = useState(() => new Map<string, { rawBalance: string; balance: BigNumber }>());

  return useCallback(
    (slug: string, rawBalance: string | undefined = '0') => {
      const cached = cache.get(slug);

      if (cached && cached.rawBalance === rawBalance) return cached.balance;

      const balance = new BigNumber(rawBalance);

      cache.set(slug, { rawBalance, balance });

      return balance;
    },
    [cache]
  );
};

const useParsedChainAssetSlugGetter = <T extends TempleChainKind>() => {
  const [cache] = useState(() => new Map<string, ParseChainReturnType<T>>());

  return useCallback(
    (chainAssetSlug: string) => {
      const cached = cache.get(chainAssetSlug);

      if (cached) return cached;

      const parsed = parseChainAssetSlug<T>(chainAssetSlug);

      cache.set(chainAssetSlug, parsed);

      return parsed;
    },
    [cache]
  );
};

const compareTokenSortKeys = (a: TokenSortKey, b: TokenSortKey) =>
  a.equity.isEqualTo(b.equity) ? compare(b.balance, a.balance) : compare(b.equity, a.equity);

const useFavoritesFirstPredicate = (
  sortKeyOf: SyncFn<string, TokenSortKey>,
  applyFavorites: boolean,
  toChainSlug: SyncFn<string, string> = identity
) => {
  const { isFavorite } = useFavoriteTokens();

  return useCallback(
    (aSlug: string, bSlug: string) => {
      if (applyFavorites) {
        const aFavorite = isFavorite(toChainSlug(aSlug));
        const bFavorite = isFavorite(toChainSlug(bSlug));
        if (aFavorite !== bFavorite) {
          return aFavorite ? -1 : 1;
        }
      }

      return compareTokenSortKeys(sortKeyOf(aSlug), sortKeyOf(bSlug));
    },
    [applyFavorites, isFavorite, toChainSlug, sortKeyOf]
  );
};

const useBalanceDescPredicate = (balanceOf: SyncFn<string, BigNumber>) =>
  useCallback((aSlug: string, bSlug: string) => compare(balanceOf(bSlug), balanceOf(aSlug)), [balanceOf]);

export const useAccountTokensSortPredicate = (
  accountTezAddress: string,
  accountEvmAddress: HexString,
  applyFavorites: boolean = false
) => {
  const tezosBalancesRecordRef = useUpdatableRef(useBalancesAtomicRecordSelector());
  const getTezosMetadata = useGetTokenOrGasMetadata();
  const tezMainnetUsdToTokenRates = useTezosUsdToTokenRatesSelector();

  const evmBalancesRecordRef = useUpdatableRef(useRawEvmAccountBalancesSelector(accountEvmAddress));
  const getEvmMetadata = useGetEvmGasOrTokenMetadata();
  const evmUsdToTokenRates = useEvmUsdToTokenRatesSelector();

  const getSortKey = useTokenSortKeyGetter();
  const parseSlug = useParsedChainAssetSlugGetter();

  const sortKeyOf = useCallback(
    (chainAssetSlug: string) => {
      const [chainKind, chainId, slug] = parseSlug(chainAssetSlug);

      if (chainKind === TempleChainKind.Tezos) {
        const tezosChainId = String(chainId);

        return getSortKey(
          chainAssetSlug,
          tezosBalancesRecordRef.current[getKeyForBalancesRecord(accountTezAddress, tezosChainId)]?.data[slug],
          getTezosMetadata(tezosChainId, slug)?.decimals,
          tezosChainId === TEZOS_MAINNET_CHAIN_ID ? tezMainnetUsdToTokenRates[slug] : undefined
        );
      }

      const evmChainId = Number(chainId);

      return getSortKey(
        chainAssetSlug,
        evmBalancesRecordRef.current[evmChainId]?.[slug],
        getEvmMetadata(evmChainId, slug)?.decimals,
        evmUsdToTokenRates[evmChainId]?.[slug]
      );
    },
    [
      parseSlug,
      getSortKey,
      tezosBalancesRecordRef,
      accountTezAddress,
      getTezosMetadata,
      tezMainnetUsdToTokenRates,
      evmBalancesRecordRef,
      getEvmMetadata,
      evmUsdToTokenRates
    ]
  );

  return useFavoritesFirstPredicate(sortKeyOf, applyFavorites);
};

export const useTezosAccountTokensSortPredicate = (publicKeyHash: string) => {
  const balancesRecordRef = useUpdatableRef(useBalancesAtomicRecordSelector());
  const getMetadata = useGetTokenOrGasMetadata();
  const mainnetUsdToTokenRates = useTezosUsdToTokenRatesSelector();
  const getSortKey = useTokenSortKeyGetter();
  const parseSlug = useParsedChainAssetSlugGetter<TempleChainKind.Tezos>();

  const sortKeyOf = useCallback(
    (chainSlug: string) => {
      const [_, chainId, slug] = parseSlug(chainSlug);

      return getSortKey(
        chainSlug,
        balancesRecordRef.current[getKeyForBalancesRecord(publicKeyHash, chainId)]?.data[slug],
        getMetadata(chainId, slug)?.decimals,
        chainId === TEZOS_MAINNET_CHAIN_ID ? mainnetUsdToTokenRates[slug] : undefined
      );
    },
    [parseSlug, getSortKey, balancesRecordRef, publicKeyHash, getMetadata, mainnetUsdToTokenRates]
  );

  return useCallback(
    (aChainSlug: string, bChainSlug: string) => compareTokenSortKeys(sortKeyOf(aChainSlug), sortKeyOf(bChainSlug)),
    [sortKeyOf]
  );
};

export const useTezosChainAccountTokensSortPredicate = (
  publicKeyHash: string,
  tezosChainId: string,
  applyFavorites: boolean = false
) => {
  const rawBalancesRef = useUpdatableRef(useAllAccountBalancesSelector(publicKeyHash, tezosChainId));
  const getMetadata = useGetChainTokenOrGasMetadata(tezosChainId);
  const mainnetUsdToTokenRates = useTezosUsdToTokenRatesSelector();
  const getSortKey = useTokenSortKeyGetter();

  const sortKeyOf = useCallback(
    (slug: string) =>
      getSortKey(
        slug,
        rawBalancesRef.current[slug],
        getMetadata(slug)?.decimals,
        tezosChainId === TEZOS_MAINNET_CHAIN_ID ? mainnetUsdToTokenRates[slug] : undefined
      ),
    [getSortKey, rawBalancesRef, getMetadata, tezosChainId, mainnetUsdToTokenRates]
  );
  const toChainSlug = useCallback(
    (slug: string) => toChainAssetSlug(TempleChainKind.Tezos, tezosChainId, slug),
    [tezosChainId]
  );

  return useFavoritesFirstPredicate(sortKeyOf, applyFavorites, toChainSlug);
};

export const useEvmAccountTokensSortPredicate = (publicKeyHash: HexString, applyFavorites: boolean = false) => {
  const balancesRecordRef = useUpdatableRef(useRawEvmAccountBalancesSelector(publicKeyHash));
  const getMetadata = useGetEvmGasOrTokenMetadata();
  const usdToTokenRates = useEvmUsdToTokenRatesSelector();
  const getSortKey = useTokenSortKeyGetter();
  const parseSlug = useParsedChainAssetSlugGetter<TempleChainKind.EVM>();

  const sortKeyOf = useCallback(
    (chainAssetSlug: string) => {
      const [_, chainId, slug] = parseSlug(chainAssetSlug);

      return getSortKey(
        chainAssetSlug,
        balancesRecordRef.current[chainId]?.[slug],
        getMetadata(chainId, slug)?.decimals,
        usdToTokenRates[chainId]?.[slug]
      );
    },
    [parseSlug, getSortKey, balancesRecordRef, getMetadata, usdToTokenRates]
  );

  return useFavoritesFirstPredicate(sortKeyOf, applyFavorites);
};

export const useEvmChainTokensSortPredicate = (
  publicKeyHash: HexString,
  chainId: number,
  applyFavorites: boolean = false
) => {
  const rawBalancesRef = useUpdatableRef(useRawEvmChainAccountBalancesSelector(publicKeyHash, chainId));
  const getMetadata = useGetEvmGasOrTokenMetadata();
  const usdToTokenRates = useEvmChainUsdToTokenRatesSelector(chainId);
  const getSortKey = useTokenSortKeyGetter();

  const sortKeyOf = useCallback(
    (slug: string) =>
      getSortKey(slug, rawBalancesRef.current[slug], getMetadata(chainId, slug)?.decimals, usdToTokenRates[slug]),
    [getSortKey, rawBalancesRef, getMetadata, chainId, usdToTokenRates]
  );
  const toChainSlug = useCallback((slug: string) => toChainAssetSlug(TempleChainKind.EVM, chainId, slug), [chainId]);

  return useFavoritesFirstPredicate(sortKeyOf, applyFavorites, toChainSlug);
};

export const useAccountCollectiblesSortPredicate = (accountTezAddress: string, accountEvmAddress: HexString) => {
  const tezosBalancesRecordRef = useUpdatableRef(useBalancesAtomicRecordSelector());
  const evmBalancesRecordRef = useUpdatableRef(useRawEvmAccountBalancesSelector(accountEvmAddress));
  const getBalance = useCollectibleBalanceGetter();
  const parseSlug = useParsedChainAssetSlugGetter();

  const balanceOf = useCallback(
    (chainAssetSlug: string) => {
      const [chainKind, chainId, slug] = parseSlug(chainAssetSlug);

      return chainKind === TempleChainKind.Tezos
        ? getBalance(
            chainAssetSlug,
            tezosBalancesRecordRef.current[getKeyForBalancesRecord(accountTezAddress, String(chainId))]?.data[slug]
          )
        : getBalance(chainAssetSlug, evmBalancesRecordRef.current[Number(chainId)]?.[slug]);
    },
    [parseSlug, getBalance, tezosBalancesRecordRef, accountTezAddress, evmBalancesRecordRef]
  );

  return useBalanceDescPredicate(balanceOf);
};

export const useTezosAccountCollectiblesSortPredicate = (account: string) => {
  const balancesRecordRef = useUpdatableRef(useBalancesAtomicRecordSelector());
  const getBalance = useCollectibleBalanceGetter();
  const parseSlug = useParsedChainAssetSlugGetter<TempleChainKind.Tezos>();

  const balanceOf = useCallback(
    (chainSlug: string) => {
      const [_, chainId, slug] = parseSlug(chainSlug);

      return getBalance(chainSlug, balancesRecordRef.current[getKeyForBalancesRecord(account, chainId)]?.data[slug]);
    },
    [parseSlug, getBalance, balancesRecordRef, account]
  );

  return useBalanceDescPredicate(balanceOf);
};

export const useTezosChainCollectiblesSortPredicate = (publicKeyHash: string, tezosChainId: string) => {
  const rawBalancesRef = useUpdatableRef(useAllAccountBalancesSelector(publicKeyHash, tezosChainId));
  const getBalance = useCollectibleBalanceGetter();

  const balanceOf = useCallback(
    (slug: string) => getBalance(slug, rawBalancesRef.current[slug]),
    [getBalance, rawBalancesRef]
  );

  return useBalanceDescPredicate(balanceOf);
};

export const useEvmAccountCollectiblesSortPredicate = (publicKeyHash: HexString) => {
  const balancesRecordRef = useUpdatableRef(useRawEvmAccountBalancesSelector(publicKeyHash));
  const getBalance = useCollectibleBalanceGetter();
  const parseSlug = useParsedChainAssetSlugGetter<TempleChainKind.EVM>();

  const balanceOf = useCallback(
    (chainAssetSlug: string) => {
      const [_, chainId, slug] = parseSlug(chainAssetSlug);

      return getBalance(chainAssetSlug, balancesRecordRef.current[chainId]?.[slug]);
    },
    [parseSlug, getBalance, balancesRecordRef]
  );

  return useBalanceDescPredicate(balanceOf);
};

export const useEvmChainCollectiblesSortPredicate = (publicKeyHash: HexString, evmChainId: number) => {
  const rawBalancesRef = useUpdatableRef(useRawEvmChainAccountBalancesSelector(publicKeyHash, evmChainId));
  const getBalance = useCollectibleBalanceGetter();

  const balanceOf = useCallback(
    (slug: string) => getBalance(slug, rawBalancesRef.current[slug]),
    [getBalance, rawBalancesRef]
  );

  return useBalanceDescPredicate(balanceOf);
};

export const compare = (a: BigNumber, b: BigNumber) => {
  if (a.isNaN() || b.isNaN()) return 0;

  return a.comparedTo(b) as number;
};
