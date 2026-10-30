import { useTezosUsdToTokenRatesSelector } from 'app/store/currency/selectors';
import { useAllAccountBalancesSelector } from 'app/store/tezos/balances/selectors';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { useEnabledTezosChainAccountTokenSlugs } from 'lib/assets/hooks';
import { toChainAssetSlug } from 'lib/assets/utils';
import { useGetChainTokenOrGasMetadata } from 'lib/metadata';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { TempleChainKind } from 'temple/types';

import { useIsTezosBigBalance } from '../listing-logic/use-is-big-balance';

import { useTezosStakingSummand } from './use-tezos-staking-summand';
import { calculateTotalDollarValue, tokenBalanceFromRaw } from './utils';

export const useTezosTotalBalance = (publicKeyHash: string, ignoreSmallBalances = false, includeStaking = false) => {
  const tokensSlugs = useEnabledTezosChainAccountTokenSlugs(publicKeyHash, TEZOS_MAINNET_CHAIN_ID);

  const rawBalances = useAllAccountBalancesSelector(publicKeyHash, TEZOS_MAINNET_CHAIN_ID);
  const getMetadata = useGetChainTokenOrGasMetadata(TEZOS_MAINNET_CHAIN_ID);
  const allUsdToTokenRates = useTezosUsdToTokenRatesSelector();
  const isBigBalance = useIsTezosBigBalance(publicKeyHash);
  const stakingSummand = useTezosStakingSummand(publicKeyHash, includeStaking);

  const slugs = useMemoWithCompare(
    () =>
      [TEZ_TOKEN_SLUG, ...tokensSlugs].filter(
        slug =>
          !ignoreSmallBalances || isBigBalance(toChainAssetSlug(TempleChainKind.Tezos, TEZOS_MAINNET_CHAIN_ID, slug))
      ),
    [tokensSlugs, ignoreSmallBalances, isBigBalance]
  );

  return calculateTotalDollarValue(
    slugs,
    slug => tokenBalanceFromRaw(rawBalances[slug], getMetadata(slug)),
    slug => allUsdToTokenRates[slug]
  )
    .plus(stakingSummand)
    .toString();
};
