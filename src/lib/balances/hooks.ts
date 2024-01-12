import { useBalancesSelector } from 'app/store/balances/selectors';
import { useAccount, useChainId } from 'lib/temple/front/ready';

export const useAccountBalances = () => {
  const { publicKeyHash } = useAccount();
  const chainId = useChainId(true)!;

  return useBalancesSelector(publicKeyHash, chainId);
};
