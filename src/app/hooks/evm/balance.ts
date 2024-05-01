import { useEvmTokensBalancesAtomicRecordSelector } from 'app/store/evm/tokens-balances/selectors';
import { TokenSlugBalanceRecord } from 'app/store/evm/tokens-balances/state';

export const useEvmAccountChainBalances = (publicKeyHash: HexString, chainId: number): TokenSlugBalanceRecord => {
  const balancesRecord = useEvmTokensBalancesAtomicRecordSelector();
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
