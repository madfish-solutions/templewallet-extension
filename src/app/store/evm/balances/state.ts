type PublicKeyHashWithChainId = string;
type TokenSlugBalanceRecord = StringRecord;

export type EVMBalancesAtomicRecord = Record<PublicKeyHashWithChainId, TokenSlugBalanceRecord>;

export interface EVMBalancesStateInterface {
  balancesAtomic: EVMBalancesAtomicRecord;
}

export const EVMBalancesInitialState: EVMBalancesStateInterface = {
  balancesAtomic: {}
};
