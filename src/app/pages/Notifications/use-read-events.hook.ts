import { TempleNotificationsSharedStorageKey, useLocalStorage } from 'lib/temple/front';
import { ActivityNotificationsInterface } from 'lib/teztok-api/interfaces';

export const useReadEvents = () => {
  const [readEventsIds, setReaded] = useLocalStorage<string[]>(TempleNotificationsSharedStorageKey.ReadEventsIds, []);

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
