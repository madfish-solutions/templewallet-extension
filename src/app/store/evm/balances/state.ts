type PublicKeyHash = HexString;
type TokenSlugWithChainIdBalanceRecord = StringRecord;

export type EVMBalancesAtomicRecord = Record<PublicKeyHash, TokenSlugWithChainIdBalanceRecord>;

export interface EVMBalancesStateInterface {
  balancesAtomic: EVMBalancesAtomicRecord;
}

export const EVMBalancesInitialState: EVMBalancesStateInterface = {
  balancesAtomic: {}
};
