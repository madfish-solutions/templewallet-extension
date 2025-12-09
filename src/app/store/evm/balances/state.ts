type PublicKeyHash = HexString;

export type AssetSlugBalanceRecord = StringRecord;

export type ChainIdTokenSlugsBalancesRecord = Record<number, AssetSlugBalanceRecord>;

type EvmBalancesAtomicRecord = Record<PublicKeyHash, ChainIdTokenSlugsBalancesRecord>;

export interface EvmBalancesStateInterface {
  balancesAtomic: EvmBalancesAtomicRecord;
  dataTimestamps: Record<PublicKeyHash, Record<number, StringRecord<number>>>;
  /**
   * Tracks which chains have already passed the initial GoldRush balances load.
   * Once a chainId is marked here, further API responses are validated for freshness.
   */
  initiallyLoadedChains: Record<number, boolean>;
}

export const EvmBalancesInitialState: EvmBalancesStateInterface = {
  balancesAtomic: {},
  dataTimestamps: {},
  initiallyLoadedChains: {}
};
