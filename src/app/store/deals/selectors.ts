import { useSelector } from '..';

export const useDealsEnabledSelector = () => useSelector(({ deals }) => deals.enabled);
