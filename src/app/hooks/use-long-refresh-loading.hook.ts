import { useDispatch } from 'react-redux';

import { loadExchangeRates } from 'app/store/tezos/currency/actions';
import { NOTIFICATIONS_SYNC_INTERVAL, RATES_SYNC_INTERVAL } from 'lib/fixed-times';
import { loadNotificationsAction } from 'lib/notifications';
import { useInterval } from 'lib/ui/hooks';

export const useLongRefreshLoading = () => {
  const dispatch = useDispatch();

  useInterval(() => dispatch(loadExchangeRates.submit()), RATES_SYNC_INTERVAL, []);

  useInterval(() => dispatch(loadNotificationsAction.submit()), NOTIFICATIONS_SYNC_INTERVAL, []);
};
