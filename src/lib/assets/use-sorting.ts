import { useCallback } from 'react';

import { BigNumber } from 'bignumber.js';

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
import {
  useGetEvmChainTokenBalanceWithDecimals,
  useGetEvmTokenBalanceWithDecimals,
  useGetTezosAccountTokenOrGasBalanceWithDecimals,
  useGetTezosChainAccountTokenOrGasBalanceWithDecimals
} from 'lib/balances/hooks';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { ZERO } from 'lib/utils/numbers';
import { useFavoriteTokens } from 'temple/front/use-favorite-tokens';
import { TempleChainKind } from 'temple/types';

import { EMPTY_FROZEN_OBJ } from '../utils';

import { fromChainAssetSlug, toChainAssetSlug } from './utils';

export const useAccountTokensSortPredicate = (
  accountTezAddress: string,
  accountEvmAddress: HexString,
  applyFavorites: boolean = false
) => {
  const getTezBalance = useGetTezosAccountTokenOrGasBalanceWithDecimals(accountTezAddress);
  const tezMainnetUsdToTokenRates = useTezosUsdToTokenRatesSelector();

  const getEvmBalance = useGetEvmTokenBalanceWithDecimals(accountEvmAddress);
  const evmUsdToTokenRates = useEvmUsdToTokenRatesSelector();

  const { isFavorite } = useFavoriteTokens();

  return useCallback(
    (aChainAssetSlug: string, bChainAssetSlug: string) => {
      if (applyFavorites) {
        const aFavorite = isFavorite(aChainAssetSlug);
        const bFavorite = isFavorite(bChainAssetSlug);
        if (aFavorite !== bFavorite) {
          return aFavorite ? -1 : 1;
        }
      }

      const [aChainKind, aChainId, aSlug] = fromChainAssetSlug(aChainAssetSlug);
      const [bChainKind, bChainId, bSlug] = fromChainAssetSlug(bChainAssetSlug);

      const aBalance =
        (aChainKind === TempleChainKind.Tezos
          ? getTezBalance(aChainId as string, aSlug)
          : getEvmBalance(Number(aChainId), aSlug)) ?? ZERO;

      const bBalance =
        (bChainKind === TempleChainKind.Tezos
          ? getTezBalance(bChainId as string, bSlug)
          : getEvmBalance(Number(bChainId), bSlug)) ?? ZERO;

      const aRate =
        (aChainKind === TempleChainKind.Tezos
          ? aChainId === TEZOS_MAINNET_CHAIN_ID
            ? tezMainnetUsdToTokenRates[aSlug]
            : ZERO
          : evmUsdToTokenRates[Number(aChainId)]?.[aSlug]) ?? ZERO;

      const bRate =
        (bChainKind === TempleChainKind.Tezos
          ? bChainId === TEZOS_MAINNET_CHAIN_ID
            ? tezMainnetUsdToTokenRates[bSlug]
            : ZERO
          : evmUsdToTokenRates[Number(bChainId)]?.[bSlug]) ?? ZERO;

      const aEquity = aBalance.multipliedBy(aRate);
      const bEquity = bBalance.multipliedBy(bRate);

      if (aEquity.isEqualTo(bEquity)) {
        return compare(bBalance, aBalance);
      }

      return compare(bEquity, aEquity);
    },
    [applyFavorites, getTezBalance, getEvmBalance, tezMainnetUsdToTokenRates, evmUsdToTokenRates, isFavorite]
  );
};

export const useTezosAccountTokensSortPredicate = (publicKeyHash: string) => {
  const getBalance = useGetTezosAccountTokenOrGasBalanceWithDecimals(publicKeyHash);
  const mainnetUsdToTokenRates = useTezosUsdToTokenRatesSelector();

  return useCallback(
    (aChainSlug: string, bChainSlug: string) => {
      const [_, aChainId, aSlug] = fromChainAssetSlug<string>(aChainSlug);
      const [_2, bChainId, bSlug] = fromChainAssetSlug<string>(bChainSlug);

      const aBalance = getBalance(aChainId, aSlug) ?? ZERO;
      const bBalance = getBalance(bChainId, bSlug) ?? ZERO;

      const aRate = aChainId === TEZOS_MAINNET_CHAIN_ID ? mainnetUsdToTokenRates[aSlug] : ZERO;
      const bRate = bChainId === TEZOS_MAINNET_CHAIN_ID ? mainnetUsdToTokenRates[bSlug] : ZERO;

      const aEquity = aBalance.multipliedBy(aRate);
      const bEquity = bBalance.multipliedBy(bRate);

      if (aEquity.isEqualTo(bEquity)) {
        return compare(bBalance, aBalance);
      }

      return compare(bEquity, aEquity);
    },
    [getBalance, mainnetUsdToTokenRates]
  );
};

export const useTezosChainAccountTokensSortPredicate = (
  publicKeyHash: string,
  tezosChainId: string,
  applyFavorites: boolean = false
) => {
  const getBalance = useGetTezosChainAccountTokenOrGasBalanceWithDecimals(publicKeyHash, tezosChainId);
  const mainnetUsdToTokenRates = useTezosUsdToTokenRatesSelector();

  const { isFavorite } = useFavoriteTokens();

  return useCallback(
    (aSlug: string, bSlug: string) => {
      if (applyFavorites) {
        const aFavorite = isFavorite(toChainAssetSlug(TempleChainKind.Tezos, tezosChainId, aSlug));
        const bFavorite = isFavorite(toChainAssetSlug(TempleChainKind.Tezos, tezosChainId, bSlug));
        if (aFavorite !== bFavorite) {
          return aFavorite ? -1 : 1;
        }
      }

      const aBalance = getBalance(aSlug) ?? ZERO;
      const bBalance = getBalance(bSlug) ?? ZERO;

      const rates = tezosChainId === TEZOS_MAINNET_CHAIN_ID ? mainnetUsdToTokenRates : EMPTY_FROZEN_OBJ;

      const aEquity = aBalance.multipliedBy(rates[aSlug] ?? ZERO);
      const bEquity = bBalance.multipliedBy(rates[bSlug] ?? ZERO);

      if (aEquity.isEqualTo(bEquity)) {
        return compare(bBalance, aBalance);
      }

      return compare(bEquity, aEquity);
    },
    [applyFavorites, getBalance, isFavorite, mainnetUsdToTokenRates, tezosChainId]
  );
};

export const useEvmAccountTokensSortPredicate = (publicKeyHash: HexString, applyFavorites: boolean = false) => {
  const getBalance = useGetEvmTokenBalanceWithDecimals(publicKeyHash);
  const usdToTokenRates = useEvmUsdToTokenRatesSelector();
  const { isFavorite } = useFavoriteTokens();

  return useCallback(
    (aChainAssetSlug: string, bChainAssetSlug: string) => {
      if (applyFavorites) {
        const aFavorite = isFavorite(aChainAssetSlug);
        const bFavorite = isFavorite(bChainAssetSlug);
        if (aFavorite !== bFavorite) {
          return aFavorite ? -1 : 1;
        }
      }

      const [_, aChainId, aSlug] = fromChainAssetSlug<number>(aChainAssetSlug);
      const [_2, bChainId, bSlug] = fromChainAssetSlug<number>(bChainAssetSlug);

      const aBalance = getBalance(aChainId, aSlug) ?? ZERO;
      const bBalance = getBalance(bChainId, bSlug) ?? ZERO;
      const aEquity = aBalance.multipliedBy(usdToTokenRates[aChainId]?.[aSlug] ?? ZERO);
      const bEquity = bBalance.multipliedBy(usdToTokenRates[bChainId]?.[bSlug] ?? ZERO);

      if (aEquity.isEqualTo(bEquity)) {
        return compare(bBalance, aBalance);
      }

      return compare(bEquity, aEquity);
    },
    [applyFavorites, getBalance, isFavorite, usdToTokenRates]
  );
};

export const useEvmChainTokensSortPredicate = (
  publicKeyHash: HexString,
  chainId: number,
  applyFavorites: boolean = false
) => {
  const getBalance = useGetEvmChainTokenBalanceWithDecimals(publicKeyHash, chainId);
  const usdToTokenRates = useEvmChainUsdToTokenRatesSelector(chainId);
  const { isFavorite } = useFavoriteTokens();

  return useCallback(
    (aSlug: string, bSlug: string) => {
      if (applyFavorites) {
        const aFavorite = isFavorite(toChainAssetSlug(TempleChainKind.EVM, chainId, aSlug));
        const bFavorite = isFavorite(toChainAssetSlug(TempleChainKind.EVM, chainId, bSlug));
        if (aFavorite !== bFavorite) {
          return aFavorite ? -1 : 1;
        }
      }

      const aBalance = getBalance(aSlug) ?? ZERO;
      const bBalance = getBalance(bSlug) ?? ZERO;
      const aEquity = aBalance.multipliedBy(usdToTokenRates[aSlug] ?? ZERO);
      const bEquity = bBalance.multipliedBy(usdToTokenRates[bSlug] ?? ZERO);

      if (aEquity.isEqualTo(bEquity)) {
        return compare(bBalance, aBalance);
      }

      return compare(bEquity, aEquity);
    },
    [applyFavorites, chainId, getBalance, isFavorite, usdToTokenRates]
  );
};

export const useAccountCollectiblesSortPredicate = (accountTezAddress: string, accountEvmAddress: HexString) => {
  const tezosBalancesRaw = useBalancesAtomicRecordSelector();
  const evmBalancesRecord = useRawEvmAccountBalancesSelector(accountEvmAddress);

  return useCallback(
    (aChainAssetSlug: string, bChainAssetSlug: string) => {
      const [aChainKind, aChainId, aSlug] = fromChainAssetSlug(aChainAssetSlug);
      const [bChainKind, bChainId, bSlug] = fromChainAssetSlug(bChainAssetSlug);

      const aBalance =
        aChainKind === TempleChainKind.Tezos
          ? new BigNumber(
              tezosBalancesRaw[getKeyForBalancesRecord(accountTezAddress, aChainId as string)]?.data[aSlug] ?? ZERO
            )
          : new BigNumber(evmBalancesRecord[aChainId as number]?.[aSlug] ?? ZERO);

      const bBalance =
        bChainKind === TempleChainKind.Tezos
          ? new BigNumber(
              tezosBalancesRaw[getKeyForBalancesRecord(accountTezAddress, bChainId as string)]?.data[bSlug] ?? ZERO
            )
          : new BigNumber(evmBalancesRecord[bChainId as number]?.[bSlug] ?? ZERO);

      return compare(bBalance, aBalance);
    },
    [accountTezAddress, evmBalancesRecord, tezosBalancesRaw]
  );
};

export const useTezosAccountCollectiblesSortPredicate = (account: string) => {
  const balancesRaw = useBalancesAtomicRecordSelector();

  return useCallback(
    (aChainSlug: string, bChainSlug: string) => {
      const [_, aChainId, aSlug] = fromChainAssetSlug<string>(aChainSlug);
      const [_2, bChainId, bSlug] = fromChainAssetSlug<string>(bChainSlug);

      const aBalancesKey = getKeyForBalancesRecord(account, aChainId);
      const bBalancesKey = getKeyForBalancesRecord(account, bChainId);

      const aBalance = new BigNumber(balancesRaw[aBalancesKey]?.data[aSlug] ?? ZERO);
      const bBalance = new BigNumber(balancesRaw[bBalancesKey]?.data[bSlug] ?? ZERO);

      return compare(bBalance, aBalance);
    },
    [account, balancesRaw]
  );
};

export const useTezosChainCollectiblesSortPredicate = (publicKeyHash: string, tezosChainId: string) => {
  const balancesRaw = useAllAccountBalancesSelector(publicKeyHash, tezosChainId);

  return useCallback(
    (aSlug: string, bSlug: string) => {
      const aBalance = new BigNumber(balancesRaw[aSlug] ?? ZERO);
      const bBalance = new BigNumber(balancesRaw[bSlug] ?? ZERO);

      return compare(bBalance, aBalance);
    },
    [balancesRaw]
  );
};

export const useEvmAccountCollectiblesSortPredicate = (publicKeyHash: HexString) => {
  const balancesRecord = useRawEvmAccountBalancesSelector(publicKeyHash);

  return useCallback(
    (aChainAssetSlug: string, bChainAssetSlug: string) => {
      const [_, aChainId, aSlug] = fromChainAssetSlug<number>(aChainAssetSlug);
      const [_2, bChainId, bSlug] = fromChainAssetSlug<number>(bChainAssetSlug);

      const aBalance = new BigNumber(balancesRecord[aChainId]?.[aSlug] ?? ZERO);
      const bBalance = new BigNumber(balancesRecord[bChainId]?.[bSlug] ?? ZERO);

      return compare(bBalance, aBalance);
    },
    [balancesRecord]
  );
};

export const useEvmChainCollectiblesSortPredicate = (publicKeyHash: HexString, evmChainId: number) => {
  const balancesRaw = useRawEvmChainAccountBalancesSelector(publicKeyHash, evmChainId);

  return useCallback(
    (aSlug: string, bSlug: string) => {
      const aBalance = new BigNumber(balancesRaw[aSlug] ?? ZERO);
      const bBalance = new BigNumber(balancesRaw[bSlug] ?? ZERO);

      return compare(bBalance, aBalance);
    },
    [balancesRaw]
  );
};

const compare = (a: BigNumber, b: BigNumber) => {
  if (a.isNaN() || b.isNaN()) return 0;

  return a.comparedTo(b) as number;
};
