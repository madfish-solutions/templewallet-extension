import { useCallback, useEffect, useMemo, useState } from 'react';

import constate from 'constate';

import { useAccount } from 'lib/temple/front';
import { getLocalStorageKey, setLocalStorageValue, useLocalStorage } from 'lib/temple/front/local-storage';
import { getLastDateLoadEvents, getLoadedEventsKey, TempleNotificationsSharedStorageKey } from 'lib/temple/types';
import { getAuctionsParticipation, getBidsByAuctions, getEvents } from 'lib/teztok-api/events';
import { LatestEventsQuery, OutbidedEventsQuery } from 'lib/teztok-api/interfaces';
import { mapLatestEventsToActivity } from 'lib/teztok-api/mappers';

// once per block
const EVENTS_REFRESH_INTERVAL = 30 * 1000;

export const [EventsProvider, useEvents] = constate((params: { suspense?: boolean }) => {
  const [chainNotificationsEnabled] = useLocalStorage<boolean>(
    TempleNotificationsSharedStorageKey.ChainNotificationsEnabled,
    true
  );

  const [time, setTime] = useState(Date.now());

  const { publicKeyHash } = useAccount();

  const [isAllLoaded, setIsAllLoaded] = useState<boolean>(false);

  const [loading, setLoading] = useState(false);

  const loadMoreEvents = useCallback(
    async (pkh: string) => {
      const storedEvents = getLocalStorageKey<LatestEventsQuery>(getLoadedEventsKey(publicKeyHash), {
        events: []
      });
      const loadingDate = getLocalStorageKey(getLastDateLoadEvents(publicKeyHash), Date.now());
      const timestamp =
        storedEvents.events.length > 0 ? storedEvents.events[0].timestamp : new Date(loadingDate).toISOString();
      setLoading(true);
      setLocalStorageValue(getLastDateLoadEvents(publicKeyHash), Date.now());
      const [eventsData, auctionsData] = await Promise.all([
        getEvents(pkh, timestamp),
        getAuctionsParticipation(pkh, timestamp)
      ]);
      let bidsData: OutbidedEventsQuery = { events: [] };
      if (auctionsData.events.length > 0) {
        bidsData = await getBidsByAuctions(auctionsData.events.map(x => x.auction_id));
      }
      setIsAllLoaded(false);
      const generalEvents = eventsData ?? { events: [] };
      const outbidEvents = bidsData ?? { events: [] };
      if (generalEvents.events.length > 0) {
        setIsAllLoaded(false);
      } else {
        setIsAllLoaded(true);
      }
      let filteredEvents = storedEvents.events
        .concat(generalEvents.events)
        .concat(outbidEvents.events.map(x => ({ ...x, price: x.currentPrice })));
      filteredEvents = filteredEvents.filter((e, i) => filteredEvents.findIndex(a => a['opid'] === e['opid']) === i);
      setLocalStorageValue(getLoadedEventsKey(publicKeyHash), { events: filteredEvents });
      setLoading(false);
      setTime(Date.now());
    },
    [publicKeyHash]
  );

  useEffect(() => {
    function tick() {
      const loadingDate = getLocalStorageKey(getLastDateLoadEvents(publicKeyHash), Date.now());
      if (!chainNotificationsEnabled || !publicKeyHash || Date.now() - loadingDate < EVENTS_REFRESH_INTERVAL) {
        return;
      }
      loadMoreEvents(publicKeyHash);
    }
    const id = setTimeout(tick, EVENTS_REFRESH_INTERVAL);
    return () => clearTimeout(id);
  }, [chainNotificationsEnabled, publicKeyHash, time, loadMoreEvents]);

  const eventsStored = getLocalStorageKey<LatestEventsQuery>(getLoadedEventsKey(publicKeyHash), { events: [] });

  const events = useMemo(() => mapLatestEventsToActivity(publicKeyHash, eventsStored), [publicKeyHash, eventsStored]);

  return {
    events,
    loading,
    isAllLoaded
  };
});
