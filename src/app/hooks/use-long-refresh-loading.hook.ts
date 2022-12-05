import { useDispatch } from 'react-redux';

import { loadExchangeRates } from 'app/store/currency/actions';
import { loadNotificationsAction } from 'lib/notifications';
import { useInterval } from 'lib/ui/hooks';

const REFRESH_INTERVAL = 5 * 60 * 1000;

export const useLongRefreshLoading = () => {
  const dispatch = useDispatch();

  useInterval(
    () => {
      dispatch(loadExchangeRates.submit());
      dispatch(loadNotificationsAction.submit());
    },
    REFRESH_INTERVAL,
    []
  );
};
