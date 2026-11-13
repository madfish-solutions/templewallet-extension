import { useRawEvmChainAccountBalancesSelector } from 'app/store/evm/balances/selectors';
import { useEvmChainUsdToTokenRatesSelector } from 'app/store/evm/tokens-exchange-rates/selectors';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { useEnabledEvmChainAccountTokenSlugs } from 'lib/assets/hooks';
import { useGetEvmGasOrTokenMetadata } from 'lib/metadata';
import { ETHEREUM_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { useMemoWithCompare } from 'lib/ui/hooks';

import { useIsEvmChainBigBalance } from '../listing-logic/use-is-big-balance';

import { useEthStakingSummand } from './use-eth-staking-summand';
import { calculateTotalDollarValue, tokenBalanceFromRaw } from './utils';

export const useEvmChainTotalBalance = (
  publicKeyHash: HexString,
  chainId: number,
  ignoreSmallBalances = false,
  includeStaking = false
) => {
  const tokenSlugs = useEnabledEvmChainAccountTokenSlugs(publicKeyHash, chainId);

  const rawBalances = useRawEvmChainAccountBalancesSelector(publicKeyHash, chainId);
  const getMetadata = useGetEvmGasOrTokenMetadata();
  const usdToTokenRates = useEvmChainUsdToTokenRatesSelector(chainId);
  const isBigBalance = useIsEvmChainBigBalance(publicKeyHash, chainId);

  const slugs = useMemoWithCompare(
    () => [EVM_TOKEN_SLUG, ...tokenSlugs].filter(slug => !ignoreSmallBalances || isBigBalance(slug)),
    [tokenSlugs, ignoreSmallBalances, isBigBalance]
  );

  const stakingSummand = useEthStakingSummand(publicKeyHash, includeStaking && chainId === ETHEREUM_MAINNET_CHAIN_ID);

  return calculateTotalDollarValue(
    slugs,
    slug => tokenBalanceFromRaw(rawBalances[slug], getMetadata(chainId, slug)),
    slug => usdToTokenRates[slug]
  )
    .plus(stakingSummand)
    .toString();
};
