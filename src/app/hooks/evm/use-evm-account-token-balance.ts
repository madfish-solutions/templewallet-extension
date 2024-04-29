import { useEvmBalancesAtomicRecordSelector } from 'app/store/evm/balances/selectors';

export const useEvmAccountTokenBalance = (
  publicKeyHash: HexString,
  chainId: number,
  tokenSlug: string
): string | undefined => {
  const balancesRecord = useEvmBalancesAtomicRecordSelector();

  const accountBalances = balancesRecord[publicKeyHash] ?? {};
  const chainIdBalances = accountBalances[chainId] ?? {};

  return chainIdBalances[tokenSlug];
};
