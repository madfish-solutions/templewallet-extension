import { useEvmBalancesAtomicRecordSelector } from 'app/store/evm/balances/selectors';
import { TokenSlugBalanceRecord } from 'app/store/evm/balances/state';

export const useEvmAccountChainBalances = (publicKeyHash: HexString, chainId: number): TokenSlugBalanceRecord => {
  const balancesRecord = useEvmBalancesAtomicRecordSelector();
  const accountBalances = balancesRecord[publicKeyHash] ?? {};

  return accountBalances[chainId] ?? {};
};

export const useEvmAccountTokenBalance = (
  publicKeyHash: HexString,
  chainId: number,
  tokenSlug: string
): string | undefined => {
  const chainIdBalances = useEvmAccountChainBalances(publicKeyHash, chainId);

  return chainIdBalances[tokenSlug];
};
