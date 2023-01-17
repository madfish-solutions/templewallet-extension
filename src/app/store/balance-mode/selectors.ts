import { useSelector } from '../index';

export const useBalanceModeSelector = () => useSelector(({ balanceMode }) => balanceMode.balanceMode);
