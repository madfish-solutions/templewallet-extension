import { useEvmChainUsdToTokenRatesSelector } from 'app/store/evm/tokens-exchange-rates/selectors';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { useEnabledEvmChainAccountTokenSlugs } from 'lib/assets/hooks';
import { useGetEvmTokenBalanceWithDecimals } from 'lib/balances/hooks';
import { ETHEREUM_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { useMemoWithCompare } from 'lib/ui/hooks';

import { useIsEvmChainBigBalance } from '../listing-logic/use-is-big-balance';

import { useEthStakingSummand } from './use-eth-staking-summand';
import { calculateTotalDollarValue } from './utils';

export const useEvmChainTotalBalance = (
  publicKeyHash: HexString,
  chainId: number,
  ignoreSmallBalances = false,
  includeStaking = false
) => {
  const tokenSlugs = useEnabledEvmChainAccountTokenSlugs(publicKeyHash, chainId);

  const getBalance = useGetEvmTokenBalanceWithDecimals(publicKeyHash);
  const usdToTokenRates = useEvmChainUsdToTokenRatesSelector(chainId);
  const isBigBalance = useIsEvmChainBigBalance(publicKeyHash, chainId);

  const slugs = useMemoWithCompare(
    () => [EVM_TOKEN_SLUG, ...tokenSlugs].filter(slug => !ignoreSmallBalances || isBigBalance(slug)),
    [tokenSlugs, ignoreSmallBalances, isBigBalance]
  );

  const stakingSummand = useEthStakingSummand(publicKeyHash, includeStaking && chainId === ETHEREUM_MAINNET_CHAIN_ID);

  return calculateTotalDollarValue(
    slugs,
    slug => getBalance(chainId, slug),
    slug => usdToTokenRates[slug]
  )
    .plus(stakingSummand)
    .toString();
};
