import { useEffect, useMemo, useRef, useState } from 'react';

import { LatestEventsQuery } from 'generated/graphql';
import { TempleNotificationsSharedStorageKey, useAccount, useLocalStorage } from 'lib/temple/front';
import { getEvents } from 'lib/teztok-api/events';

import { mapLatestEventsToActivity } from './ActivityNotifications/util';

export const useEvents = () => {
  const [chainNotificationsEnabled] = useLocalStorage<boolean>(
    TempleNotificationsSharedStorageKey.ChainNotificationsEnabled,
    true
  );

  const { publicKeyHash } = useAccount();
  const [isAllLoaded, setIsAllLoaded] = useState<boolean>(false);
  const [loadedEvents, setLoadedEvents] = useState<LatestEventsQuery>({ events: [] });
  const lastEventsIdRef = useRef<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // if (Date.now() - loadingDate < NEWS_REFRESH_INTERVAL || !newsNotificationsEnabled) {
        //   return;
        // }
        if (!chainNotificationsEnabled || !publicKeyHash) {
          return;
        }
        // setLoadingDate(Date.now());
        setLoading(true);
        const data = await getEvents(publicKeyHash);
        setIsAllLoaded(false);
        const events = data ?? { events: [] };
        if (events.events.length > 0) {
          setIsAllLoaded(false);
        } else {
          setIsAllLoaded(true);
        }
        setLoadedEvents(events);
        setLoading(false);
      } catch {
        setLoading(false);
      }
      setLoading(false);
    })();
  }, [publicKeyHash, chainNotificationsEnabled]);

  const handleUpdate = async () => {
    if (loadedEvents.events.length > 0 && !isAllLoaded) {
      const lastEvents = loadedEvents.events[loadedEvents.events.length - 1];

      if (lastEvents) {
        if (lastEvents.opid !== lastEventsIdRef.current) {
          lastEventsIdRef.current = lastEvents.opid;
          setLoading(true);
          const data = await getEvents(publicKeyHash, lastEvents.timestamp);
          const events = data ?? { events: [] };
          if (events.events.length === 0) {
            setIsAllLoaded(true);
          }
          setLoading(false);
          setLoadedEvents(prev => {
            let array = prev.events.concat(events.events);
            array = array.filter((e, i) => array.findIndex(a => a['opid'] === e['opid']) === i);
            return { events: array };
          });
        }
      }
    }
  };

  const events = useMemo(() => mapLatestEventsToActivity(publicKeyHash, loadedEvents), [publicKeyHash, loadedEvents]);

  return {
    events,
    loading,
    isAllLoaded,
    handleUpdate
  };
};
