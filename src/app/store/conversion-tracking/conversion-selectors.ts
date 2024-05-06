import { useSelector } from '../index';

export const useIsConversionTrackedSelector = () => useSelector(({ conversion }) => conversion.isTracked);
