type PublicKeyHash = HexString;
export type TokenSlugBalanceRecord = StringRecord;
type ChainIdTokenSlugsRecord = Record<number, TokenSlugBalanceRecord>;

type EvmBalancesAtomicRecord = Record<PublicKeyHash, ChainIdTokenSlugsRecord>;

export interface EvmBalancesStateInterface {
  balancesAtomic: EvmBalancesAtomicRecord;
}

export const EvmBalancesInitialState: EvmBalancesStateInterface = {
  balancesAtomic: {}
};
