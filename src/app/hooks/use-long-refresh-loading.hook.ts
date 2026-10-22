import { dispatch } from 'app/store';
import { loadExchangeRates } from 'app/store/currency/actions';
import { loadNotificationsAction } from 'app/store/notifications/actions';
import { getTezosNotificationAccountAddresses } from 'app/store/notifications/utils';
import { NOTIFICATIONS_SYNC_INTERVAL, RATES_SYNC_INTERVAL } from 'lib/fixed-times';
import { useInterval } from 'lib/ui/hooks';
import { useAllAccounts } from 'temple/front';

export const useLongRefreshLoading = () => {
  const allAccounts = useAllAccounts();

  useInterval(() => dispatch(loadExchangeRates.submit()), [], RATES_SYNC_INTERVAL);

  useInterval(
    () =>
      dispatch(
        loadNotificationsAction.submit({
          accountAddresses: getTezosNotificationAccountAddresses(allAccounts)
        })
      ),
    [allAccounts],
    NOTIFICATIONS_SYNC_INTERVAL
  );
};
