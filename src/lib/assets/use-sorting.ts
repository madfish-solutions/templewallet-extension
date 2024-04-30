import { useCallback } from 'react';

import { BigNumber } from 'bignumber.js';

import { useEvmChainTokensMetadata } from 'app/hooks/evm/metadata';
import { useEvmUsdToTokenRatesSelector } from 'app/store/evm/currency/selectors';
import { useAllAccountBalancesSelector } from 'app/store/tezos/balances/selectors';
import { useTezosUsdToTokenRatesSelector } from 'app/store/tezos/currency/selectors';
import { useGetEvmTokenBalanceWithDecimals, useGetTezosTokenOrGasBalanceWithDecimals } from 'lib/balances/hooks';
import { ZERO } from 'lib/utils/numbers';

export const useTokensSortPredicate = (publicKeyHash: string, tezosChainId: string) => {
  const getBalance = useGetTezosTokenOrGasBalanceWithDecimals(publicKeyHash, tezosChainId);
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

export const useEvmTokensSortPredicate = (publicKeyHash: HexString, chainId: number) => {
  const chainTokensMetadata = useEvmChainTokensMetadata(chainId);
  const getBalance = useGetEvmTokenBalanceWithDecimals(publicKeyHash, chainId);
  const usdToTokenRates = useEvmUsdToTokenRatesSelector();

  return useCallback(
    (aSlug: string, bSlug: string) => {
      const aBalance = getBalance(aSlug) ?? ZERO;
      const bBalance = getBalance(bSlug) ?? ZERO;
      const aEquity = aBalance.multipliedBy(usdToTokenRates[chainId]?.[aSlug] ?? ZERO);
      const bEquity = bBalance.multipliedBy(usdToTokenRates[chainId]?.[bSlug] ?? ZERO);

      // native token on top of the list
      if (chainTokensMetadata[aSlug]?.native) return -1;
      if (chainTokensMetadata[bSlug]?.native) return 1;

      if (aEquity.isEqualTo(bEquity)) {
        return bBalance.comparedTo(aBalance);
      }

      return bEquity.comparedTo(aEquity);
    },
    [chainId, chainTokensMetadata, getBalance, usdToTokenRates]
  );
};

export const useCollectiblesSortPredicate = (publicKeyHash: string, tezosChainId: string) => {
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
