type PublicKeyHash = HexString;
export type AssetSlugBalanceRecord = StringRecord;
type ChainIdTokenSlugsRecord = Record<number, AssetSlugBalanceRecord>;

type EvmBalancesAtomicRecord = Record<PublicKeyHash, ChainIdTokenSlugsRecord>;

export interface EvmBalancesStateInterface {
  balancesAtomic: EvmBalancesAtomicRecord;
}

export const EvmBalancesInitialState: EvmBalancesStateInterface = {
  balancesAtomic: {}
};
