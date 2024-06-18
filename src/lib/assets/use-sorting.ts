import { useCallback } from 'react';

import { BigNumber } from 'bignumber.js';

import { useRawEvmChainAccountBalancesSelector } from 'app/store/evm/balances/selectors';
import { useEvmUsdToTokenRatesSelector } from 'app/store/evm/tokens-exchange-rates/selectors';
import { useAllAccountBalancesSelector } from 'app/store/tezos/balances/selectors';
import { useTezosUsdToTokenRatesSelector } from 'app/store/tezos/currency/selectors';
import {
  useGetEvmTokenBalanceWithDecimals,
  useGetTezosAccountTokenOrGasBalanceWithDecimals,
  useGetTezosChainAccountTokenOrGasBalanceWithDecimals
} from 'lib/balances/hooks';
import { ZERO } from 'lib/utils/numbers';

import { fromChainAssetSlug } from './utils';

export const useTezosAccountTokensSortPredicate = (publicKeyHash: string) => {
  const getBalance = useGetTezosAccountTokenOrGasBalanceWithDecimals(publicKeyHash);
  const usdToTokenRates = useTezosUsdToTokenRatesSelector();

  return useCallback(
    (aChainSlug: string, bChainSlug: string) => {
      const [aChainId, aSlug] = fromChainAssetSlug(aChainSlug);
      const [bChainId, bSlug] = fromChainAssetSlug(bChainSlug);

      const aBalance = getBalance(aChainId, aSlug) ?? ZERO;
      const bBalance = getBalance(bChainId, bSlug) ?? ZERO;
      const aEquity = aBalance.multipliedBy(usdToTokenRates[aSlug] ?? ZERO);
      const bEquity = bBalance.multipliedBy(usdToTokenRates[bSlug] ?? ZERO);

      if (aEquity.isEqualTo(bEquity)) {
        return bBalance.comparedTo(aBalance);
      }

      return bEquity.comparedTo(aEquity);
    },
    [getBalance, usdToTokenRates]
  );
};

export const useTezosChainAccountTokensSortPredicate = (publicKeyHash: string, tezosChainId: string) => {
  const getBalance = useGetTezosChainAccountTokenOrGasBalanceWithDecimals(publicKeyHash, tezosChainId);
  const usdToTokenRates = useTezosUsdToTokenRatesSelector();

  return useCallback(
    (aSlug: string, bSlug: string) => {
      const aBalance = getBalance(aSlug) ?? ZERO;
      const bBalance = getBalance(bSlug) ?? ZERO;
      const aEquity = aBalance.multipliedBy(usdToTokenRates[aSlug] ?? ZERO);
      const bEquity = bBalance.multipliedBy(usdToTokenRates[bSlug] ?? ZERO);

      if (aEquity.isEqualTo(bEquity)) {
        return bBalance.comparedTo(aBalance);
      }

      return bEquity.comparedTo(aEquity);
    },
    [getBalance, usdToTokenRates]
  );
};

export const useEvmAccountTokensSortPredicate = (publicKeyHash: HexString) => {
  const getBalance = useGetEvmTokenBalanceWithDecimals(publicKeyHash);
  const usdToTokenRates = useEvmUsdToTokenRatesSelector();

  return useCallback(
    (aChainSlug: string, bChainSlug: string) => {
      const [aChainId, aSlug] = fromChainAssetSlug<number>(aChainSlug);
      const [bChainId, bSlug] = fromChainAssetSlug<number>(bChainSlug);

      const aBalance = getBalance(aChainId, aSlug) ?? ZERO;
      const bBalance = getBalance(bChainId, bSlug) ?? ZERO;
      const aEquity = aBalance.multipliedBy(usdToTokenRates[aChainId]?.[aSlug] ?? ZERO);
      const bEquity = bBalance.multipliedBy(usdToTokenRates[bChainId]?.[bSlug] ?? ZERO);

      if (aEquity.isEqualTo(bEquity)) {
        return bBalance.comparedTo(aBalance);
      }

      return bEquity.comparedTo(aEquity);
    },
    [getBalance, usdToTokenRates]
  );
};

export const useEvmChainTokensSortPredicate = (publicKeyHash: HexString, chainId: number) => {
  const getBalance = useGetEvmTokenBalanceWithDecimals(publicKeyHash);
  const usdToTokenRates = useEvmUsdToTokenRatesSelector();

  return useCallback(
    (aSlug: string, bSlug: string) => {
      const aBalance = getBalance(chainId, aSlug) ?? ZERO;
      const bBalance = getBalance(chainId, bSlug) ?? ZERO;
      const aEquity = aBalance.multipliedBy(usdToTokenRates[chainId]?.[aSlug] ?? ZERO);
      const bEquity = bBalance.multipliedBy(usdToTokenRates[chainId]?.[bSlug] ?? ZERO);

      if (aEquity.isEqualTo(bEquity)) {
        return bBalance.comparedTo(aBalance);
      }

      return bEquity.comparedTo(aEquity);
    },
    [chainId, getBalance, usdToTokenRates]
  );
};

export const useTezosCollectiblesSortPredicate = (publicKeyHash: string, tezosChainId: string) => {
  const balancesRaw = useAllAccountBalancesSelector(publicKeyHash, tezosChainId);

  return useCallback(
    (aSlug: string, bSlug: string) => {
      const aBalance = new BigNumber(balancesRaw[aSlug] ?? ZERO);
      const bBalance = new BigNumber(balancesRaw[bSlug] ?? ZERO);

      return bBalance.comparedTo(aBalance);
    },
    [balancesRaw]
  );
};

export const useEvmCollectiblesSortPredicate = (publicKeyHash: HexString, evmChainId: number) => {
  const balancesRaw = useRawEvmChainAccountBalancesSelector(publicKeyHash, evmChainId);

  return useCallback(
    (aSlug: string, bSlug: string) => {
      const aBalance = new BigNumber(balancesRaw[aSlug] ?? ZERO);
      const bBalance = new BigNumber(balancesRaw[bSlug] ?? ZERO);

      return bBalance.comparedTo(aBalance);
    },
    [balancesRaw]
  );
};
