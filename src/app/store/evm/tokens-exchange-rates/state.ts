type ChainId = number;

type TokenSlugExchangeRateRecord = StringRecord<number>;

type EvmTokensExchangeRateRecord = Record<ChainId, TokenSlugExchangeRateRecord>;

export interface EvmTokensExchangeRateState {
  usdToTokenRates: EvmTokensExchangeRateRecord;
}

export const evmTokensExchangeRatesInitialState: EvmTokensExchangeRateState = {
  usdToTokenRates: {}
};
