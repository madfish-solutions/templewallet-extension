type ChainId = number;

type TokenSlugExchangeRateRecord = StringRecord<number>;

type EvmTokensExchangeRateRecord = Record<ChainId, TokenSlugExchangeRateRecord>;

export interface EvmTokensExchangeRateState {
  usdToTokenRates: EvmTokensExchangeRateRecord;
  timestamps: Record<number, number>;
}

export const evmTokensExchangeRatesInitialState: EvmTokensExchangeRateState = {
  usdToTokenRates: {},
  timestamps: {}
};
