import { useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';

import { useEvmUsdToTokenRatesSelector } from 'app/store/evm/tokens-exchange-rates/selectors';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { useEnabledEvmAccountTokenSlugs } from 'lib/assets/hooks';
import { fromChainAssetSlug, toChainAssetSlug } from 'lib/assets/utils';
import { useGetEvmTokenBalanceWithDecimals } from 'lib/balances/hooks';
import { isTruthy } from 'lib/utils';
import { ZERO } from 'lib/utils/numbers';
import { useEnabledEvmChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

export const useEvmAccountTotalBalance = (publicKeyHash: HexString) => {
  const enabledChainSlugs = useEnabledEvmAccountTokenSlugs(publicKeyHash);

  const getBalance = useGetEvmTokenBalanceWithDecimals(publicKeyHash);
  const usdToTokenRates = useEvmUsdToTokenRatesSelector();

  const enabledChains = useEnabledEvmChains();

  const chainSlugs = useMemo(
    () => [
      ...enabledChains.map(chain => toChainAssetSlug(TempleChainKind.EVM, chain.chainId, EVM_TOKEN_SLUG)),
      ...enabledChainSlugs
    ],
    [enabledChainSlugs, enabledChains]
  );

  return useMemo(() => {
    let dollarValue = ZERO;

    for (const chainSlug of chainSlugs) {
      const [_, chainId, slug] = fromChainAssetSlug<number>(chainSlug);

      const balance = getBalance(chainId, slug);
      const usdToTokenRate = usdToTokenRates[chainId]?.[slug];
      const tokenDollarValue = isDefined(balance) && isTruthy(usdToTokenRate) ? balance.times(usdToTokenRate) : ZERO;
      dollarValue = dollarValue.plus(tokenDollarValue);
    }

    return dollarValue.toString();
  }, [chainSlugs, getBalance, usdToTokenRates]);
};
