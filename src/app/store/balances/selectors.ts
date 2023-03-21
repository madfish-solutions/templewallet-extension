import { useSelector } from '..';
import { PublicKeyHashWithChainId } from './state';

const EMPTY_BALANCES_RECORD = {};

export const useBalancesSelector = (publicKeyHashWithChainId: PublicKeyHashWithChainId) =>
  useSelector(state => state.balances.balancesAtomic[publicKeyHashWithChainId]?.data ?? EMPTY_BALANCES_RECORD);
