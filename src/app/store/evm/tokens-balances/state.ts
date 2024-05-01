type PublicKeyHash = HexString;
export type TokenSlugBalanceRecord = StringRecord;
type ChainIdTokenSlugsRecord = Record<number, TokenSlugBalanceRecord>;

type EvmTokensBalancesAtomicRecord = Record<PublicKeyHash, ChainIdTokenSlugsRecord>;

export interface EvmTokensBalancesStateInterface {
  balancesAtomic: EvmTokensBalancesAtomicRecord;
}

export const EvmTokensBalancesInitialState: EvmTokensBalancesStateInterface = {
  balancesAtomic: {}
};
