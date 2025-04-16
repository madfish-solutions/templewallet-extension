import { useSelector } from 'app/store/root-state.selector';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { ETHEREUM_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { EMPTY_FROZEN_OBJ } from 'lib/utils';

export const useEvmUsdToTokenRatesSelector = () =>
  useSelector(({ evmTokensExchangeRates }) => evmTokensExchangeRates.usdToTokenRates);

export const useEvmUsdToTokenRatesTimestampsSelector = () =>
  useSelector(({ evmTokensExchangeRates }) => evmTokensExchangeRates.timestamps);

export const useEvmChainUsdToTokenRatesSelector = (chainId: number) =>
  useSelector(({ evmTokensExchangeRates }) => evmTokensExchangeRates.usdToTokenRates[chainId] ?? EMPTY_FROZEN_OBJ);

export const useEthUsdToTokenRateSelector = () =>
  useEvmChainUsdToTokenRatesSelector(ETHEREUM_MAINNET_CHAIN_ID)[EVM_TOKEN_SLUG];
