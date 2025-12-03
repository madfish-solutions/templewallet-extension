import { useSelector } from 'app/store/root-state.selector';

export const useStakeWithdrawalReadyNotificationsSelector = (chainId: number, address: HexString) =>
  useSelector(state => state.evmStakeWithdrawalReadyNotifications.notified[chainId]?.[address] ?? false);
