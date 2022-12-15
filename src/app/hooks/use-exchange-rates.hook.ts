import { useDispatch } from 'react-redux';

import { loadExchangeRates } from 'app/store/currency/actions';
import { useInterval } from 'lib/ui/hooks';

const REFRESH_INTERVAL = 5 * 60_000;

export const useExchangeRatesLoading = () => {
  const dispatch = useDispatch();

  useInterval(() => void dispatch(loadExchangeRates.submit()), REFRESH_INTERVAL, []);
};
