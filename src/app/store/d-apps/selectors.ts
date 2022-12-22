import { useSelector } from '../index';

export const useTokensApyInfoSelector = () => useSelector(({ dApps }) => dApps.tokensApyInfo);
