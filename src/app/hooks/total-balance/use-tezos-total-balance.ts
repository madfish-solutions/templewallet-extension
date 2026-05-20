import { useTezosUsdToTokenRatesSelector } from 'app/store/currency/selectors';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { useEnabledTezosChainAccountTokenSlugs } from 'lib/assets/hooks';
import { toChainAssetSlug } from 'lib/assets/utils';
import { useGetTezosChainAccountTokenOrGasBalanceWithDecimals } from 'lib/balances/hooks';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { TempleChainKind } from 'temple/types';

import { useIsTezosBigBalance } from '../listing-logic/use-is-big-balance';

import { calculateTotalDollarValue } from './utils';

export const useTezosTotalBalance = (publicKeyHash: string, ignoreSmallBalances = false) => {
  const tokensSlugs = useEnabledTezosChainAccountTokenSlugs(publicKeyHash, TEZOS_MAINNET_CHAIN_ID);

  const getBalance = useGetTezosChainAccountTokenOrGasBalanceWithDecimals(publicKeyHash, TEZOS_MAINNET_CHAIN_ID);
  const allUsdToTokenRates = useTezosUsdToTokenRatesSelector();
  const isBigBalance = useIsTezosBigBalance(publicKeyHash);

  const slugs = useMemoWithCompare(
    () =>
      [TEZ_TOKEN_SLUG, ...tokensSlugs].filter(
        slug =>
          !ignoreSmallBalances || isBigBalance(toChainAssetSlug(TempleChainKind.Tezos, TEZOS_MAINNET_CHAIN_ID, slug))
      ),
    [tokensSlugs, ignoreSmallBalances, isBigBalance]
  );

  return calculateTotalDollarValue(slugs, getBalance, slug => allUsdToTokenRates[slug]);
};
