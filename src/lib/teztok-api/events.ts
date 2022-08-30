import axios from 'axios';

import { LatestEventsQuery, OutbidedEventsQuery } from './interfaces';
import { createAuctionsParticipationQuery, createBidsByAuctionQuery, createEventsQuery } from './queries';

const config = {
  url: 'https://api.teztok.com/v1/graphql',
  headers: {
    accept: 'application/json'
  }
};

export const getEvents = (pkh: string, timestamp?: string): Promise<LatestEventsQuery> => {
  return axios
    .request<{ data?: LatestEventsQuery }>({
      method: 'POST',
      url: config.url,
      headers: config.headers,
      data: createEventsQuery(pkh, timestamp)
    })
    .then(x => ({ events: (x.data.data ?? { events: [] }).events }))
    .catch(() => {
      return { events: [] };
    });
};

export const getAuctionsParticipation = (pkh: string, timestamp?: string): Promise<LatestEventsQuery> => {
  return axios
    .request<{ data?: LatestEventsQuery }>({
      method: 'POST',
      url: config.url,
      headers: config.headers,
      data: createAuctionsParticipationQuery(pkh, timestamp)
    })
    .then(x => ({ events: (x.data.data ?? { events: [] }).events }))
    .catch(() => {
      return { events: [] };
    });
};

export const getBidsByAuctions = (auctionIds: Array<number>): Promise<OutbidedEventsQuery> => {
  return axios
    .request<{ data?: OutbidedEventsQuery }>({
      method: 'POST',
      url: config.url,
      headers: config.headers,
      data: createBidsByAuctionQuery(auctionIds)
    })
    .then(x => ({ events: (x.data.data ?? { events: [] }).events }))
    .catch(() => {
      return { events: [] };
    });
};
