import { getReadEventsIds, useAccount, useLocalStorage } from 'lib/temple/front';

import { ActivityNotificationsInterface } from './ActivityNotifications/ActivityNotifications.interface';

export const useReadEvents = () => {
  const { publicKeyHash } = useAccount();

  const [readEventsIds, setReaded] = useLocalStorage<string[]>(getReadEventsIds(publicKeyHash), []);

  const readOneEvent = (id: string) => {
    setReaded(prev => [...prev, id]);
  };

  const readManyEvents = (ids: string[]) => {
    setReaded([...readEventsIds, ...ids]);
  };

  const isEventUnread = (event: ActivityNotificationsInterface) => readEventsIds.indexOf(event.id) < 0;

  return {
    readEventsIds,
    readOneEvent,
    readManyEvents,
    isEventUnread
  };
};
