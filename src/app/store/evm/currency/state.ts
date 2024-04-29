type ChainId = number;
export type TokenSlugExchangeRateRecord = StringRecord<number>;
type EvmExchangeRateRecord = Record<ChainId, TokenSlugExchangeRateRecord>;

export interface EvmCurrencyState {
  usdToTokenRates: EvmExchangeRateRecord;
}

export const evmCurrencyInitialState: EvmCurrencyState = {
  usdToTokenRates: {}
};
