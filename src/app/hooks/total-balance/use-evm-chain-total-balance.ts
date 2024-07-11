import { useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';

import { useEvmChainUsdToTokenRatesSelector } from 'app/store/evm/tokens-exchange-rates/selectors';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { useEnabledEvmChainAccountTokenSlugs } from 'lib/assets/hooks';
import { useGetEvmTokenBalanceWithDecimals } from 'lib/balances/hooks';
import { isTruthy } from 'lib/utils';
import { ZERO } from 'lib/utils/numbers';

export const useEvmChainTotalBalance = (publicKeyHash: HexString, chainId: number) => {
  const tokenSlugs = useEnabledEvmChainAccountTokenSlugs(publicKeyHash, chainId);

  const getEvmBalance = useGetEvmTokenBalanceWithDecimals(publicKeyHash);
  const usdToTokenRates = useEvmChainUsdToTokenRatesSelector(chainId);

  const slugs = useMemo(() => [EVM_TOKEN_SLUG, ...tokenSlugs], [tokenSlugs]);

  return useMemo(() => {
    let dollarValue = ZERO;

    for (const slug of slugs) {
      const balance = getEvmBalance(chainId, slug);
      const usdToTokenRate = usdToTokenRates[slug];
      const tokenDollarValue = isDefined(balance) && isTruthy(usdToTokenRate) ? balance.times(usdToTokenRate) : ZERO;
      dollarValue = dollarValue.plus(tokenDollarValue);
    }

    return dollarValue.toString();
  }, [slugs, getEvmBalance, chainId, usdToTokenRates]);
};
