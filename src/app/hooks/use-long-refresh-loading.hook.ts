import { dispatch } from 'app/store';
import { loadExchangeRates } from 'app/store/currency/actions';
import { NOTIFICATIONS_SYNC_INTERVAL, RATES_SYNC_INTERVAL } from 'lib/fixed-times';
import { loadNotificationsAction } from 'lib/notifications';
import { useInterval } from 'lib/ui/hooks';

export const useLongRefreshLoading = () => {
  useInterval(() => dispatch(loadExchangeRates.submit()), [], RATES_SYNC_INTERVAL);

  useInterval(() => dispatch(loadNotificationsAction.submit()), [], NOTIFICATIONS_SYNC_INTERVAL);
};
