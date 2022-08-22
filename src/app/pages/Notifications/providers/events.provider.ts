import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import constate from 'constate';

import { useAccount } from 'lib/temple/front';
import { useLocalStorage } from 'lib/temple/front/local-storage';
import { getLastDateLoadEvents, getLoadedEventsKey, TempleNotificationsSharedStorageKey } from 'lib/temple/types';
import { getEvents, LatestEventsQuery } from 'lib/teztok-api/events';
import { mapLatestEventsToActivity } from 'lib/teztok-api/util';

// once per block
const EVENTS_REFRESH_INTERVAL = 30 * 1000;

export const [EventsProvider, useEvents] = constate((params: { suspense?: boolean }) => {
  const [chainNotificationsEnabled] = useLocalStorage<boolean>(
    TempleNotificationsSharedStorageKey.ChainNotificationsEnabled,
    true
  );

  const { publicKeyHash } = useAccount();

  const [loadingDate, setLoadingDate] = useLocalStorage(getLastDateLoadEvents(publicKeyHash), Date.now());

  const [isAllLoaded, setIsAllLoaded] = useState<boolean>(false);
  const [loadedEvents, setLoadedEvents] = useLocalStorage<LatestEventsQuery>(getLoadedEventsKey(publicKeyHash), {
    events: []
  });
  const lastEventsIdRef = useRef<string>('');
  const [loading, setLoading] = useState(false);

  const loadEvents = useCallback(async (pkh: string) => {
    setLoading(true);
    setLoadingDate(Date.now());
    const data = await getEvents(pkh);
    setIsAllLoaded(false);
    const events = data ?? { events: [] };
    if (events.events.length > 0) {
      setIsAllLoaded(false);
    } else {
      setIsAllLoaded(true);
    }
    setLoadedEvents(events);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMoreEvents = useCallback(async (pkh: string, timestamp: string) => {
    setLoading(true);
    setLoadingDate(Date.now());
    const data = await getEvents(pkh, timestamp);
    // const data = await getEvents(pkh);
    setIsAllLoaded(false);
    const events = data ?? { events: [] };
    if (events.events.length > 0) {
      setIsAllLoaded(false);
    } else {
      setIsAllLoaded(true);
    }
    setLoadedEvents(prev => {
      let array = prev.events.concat(events.events);
      array = array.filter((e, i) => array.findIndex(a => a['opid'] === e['opid']) === i);
      return { events: array };
    });
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      // if (!chainNotificationsEnabled || !publicKeyHash || Date.now() - loadingDate < EVENTS_REFRESH_INTERVAL) {
      if (!chainNotificationsEnabled || !publicKeyHash) {
        return;
      }
      loadEvents(publicKeyHash);
    } catch {
      setLoading(false);
    }
  }, [publicKeyHash, chainNotificationsEnabled, loadEvents]);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (!chainNotificationsEnabled || !publicKeyHash) {
          return;
        }
        loadMoreEvents(
          publicKeyHash,
          loadedEvents.events.length > 0
            ? loadedEvents.events[0].timestamp
            : `${new Date().toISOString().split('.')[0]}+00:00`
        );
      } catch {
        setLoading(false);
      }
    }, EVENTS_REFRESH_INTERVAL);
    return clearTimeout(timer);
  }, [publicKeyHash, chainNotificationsEnabled, loadedEvents.events, loadMoreEvents]);

  // const handleUpdate = async () => {
  //   try {
  //     // if (!chainNotificationsEnabled || !publicKeyHash || Date.now() - loadingDate < EVENTS_REFRESH_INTERVAL) {
  //     if (!chainNotificationsEnabled || !publicKeyHash) {
  //       return;
  //     }
  //     loadEvents(publicKeyHash);
  //     setLoadingDate(Date.now());
  //   } catch {
  //     setLoading(false);
  //   }
  //   // if (loadedEvents.events.length > 0 && !isAllLoaded) {
  //   //   const lastEvents = loadedEvents.events[loadedEvents.events.length - 1];
  //   //   if (lastEvents) {
  //   //     if (lastEvents.opid !== lastEventsIdRef.current) {
  //   //       lastEventsIdRef.current = lastEvents.opid;
  //   //       setLoading(true);

  //   //       const data = await getEvents(publicKeyHash, lastEvents.timestamp);
  //   //       const events = data ?? { events: [] };
  //   //       if (events.events.length === 0) {
  //   //         setIsAllLoaded(true);
  //   //       }
  //   //       setLoading(false);
  //   //       setLoadedEvents(prev => {
  //   //         let array = prev.events.concat(events.events);
  //   //         array = array.filter((e, i) => array.findIndex(a => a['opid'] === e['opid']) === i);
  //   //         return { events: array };
  //   //       });
  //   //     }
  //   //   }
  //   // }
  // };

  const events = useMemo(() => mapLatestEventsToActivity(publicKeyHash, loadedEvents), [publicKeyHash, loadedEvents]);

  return {
    events,
    loading,
    isAllLoaded
    // handleUpdate
  };
});
