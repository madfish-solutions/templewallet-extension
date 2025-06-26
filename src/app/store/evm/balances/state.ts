type PublicKeyHash = HexString;

export type AssetSlugBalanceRecord = StringRecord;

export type ChainIdTokenSlugsBalancesRecord = Record<number, AssetSlugBalanceRecord>;

type EvmBalancesAtomicRecord = Record<PublicKeyHash, ChainIdTokenSlugsBalancesRecord>;

export interface EvmBalancesStateInterface {
  balancesAtomic: EvmBalancesAtomicRecord;
  dataTimestamps: Record<PublicKeyHash, Record<number, StringRecord<number>>>;
}

export const EvmBalancesInitialState: EvmBalancesStateInterface = {
  balancesAtomic: {},
  dataTimestamps: {}
};
