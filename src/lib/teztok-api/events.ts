import axios from 'axios';

type GeneralEventsType = {
  __typename?: 'events';
  type?: string | null;
  timestamp: any;
  amount?: any | null;
  auction_id?: any | null;
  owner_address?: string | null;
  from_address?: string | null;
  to_address?: string | null;
  bidder_address?: string | null;
  buyer_address?: string | null;
  seller_address?: string | null;
  artist_address?: string | null;
  opid: any;
  ophash?: string | null;
  start_time: any | null;
  end_time: any | null;
  price?: any | null;
  token?: {
    __typename?: 'tokens';
    fa2_address: string;
    token_id: string;
    artist_address?: string | null;
    symbol?: string | null;
    name?: string | null;
    description?: string | null;
    price?: any | null;
    royalties?: any | null;
    royalties_total?: any | null;
  } | null;
};

export type LatestEventsQuery = {
  __typename?: 'query_root';
  events: Array<GeneralEventsType>;
};

export type OutbidedEventsQuery = {
  __typename?: 'query_root';
  events: Array<GeneralEventsType & { currentPrice?: any | null }>;
};

const createEventsQuery = (pkh: string, timestamp = new Date().toISOString()) =>
  JSON.stringify({
    query: `query LatestEvents($account: String!, $_gt: timestamptz) {
  events(
    ${timestamp ? '' : 'limit: 100'}
    where: {
      token: { metadata_status: { _eq: "processed" } }
      _and: {
        _or: [
          { bidder_address: { _eq: $account } }
          { artist_address: { _eq: $account } }
          { owner_address: { _eq: $account } }
          { buyer_address: { _eq: $account } }
          { seller_address: { _eq: $account } }
          { from_address: { _eq: $account } }
          { to_address: { _eq: $account } }
        ]
      }
      timestamp: { _gt: $_gt }
    }
    order_by: { opid: desc }
  ) {
    type
    timestamp
    token {
      fa2_address
      token_id
      artist_address
      symbol
      name
      description
      price
      royalties
      royalties_total
    }
    amount
    auction_id
    owner_address
    from_address
    to_address
    bidder_address
    buyer_address
    seller_address
    artist_address
    opid
    ophash
    price
  }
}`,
    variables: { account: pkh, _gt: timestamp }
  });

const createAuctionsParticipationQuery = (pkh: string, timestamp = new Date().toISOString()) =>
  JSON.stringify({
    query: `query AuctionParticipation($account: String = "", $_gt: timestamptz) {
      events(
        ${timestamp ? '' : 'limit: 100'}
        order_by: { auction_id: desc }
        where: {
          type: { _eq: "OBJKT_BID_ENGLISH_AUCTION" }
          bidder_address: { _eq: $account }
          timestamp: { _gt: $_gt }
        }
        distinct_on: auction_id
      ) {
        auction_id
        start_time
        end_time
      }
    }`,
    variables: { account: pkh, _gt: timestamp }
  });

const populateAuctionQueries = (auctions: Array<number>) =>
  auctions
    .map(
      id => `auction_${id}: events(
  limit: 1
  order_by: { opid: desc }
  where: {
    type: { _eq: "OBJKT_BID_ENGLISH_AUCTION" }
    auction_id: { _eq: ${id} }
  }
) {
  ...eventsFragment
}`
    )
    .join('\n');

const createBidsByAuctionQuery = (auctionIds: Array<number>) =>
  JSON.stringify({
    query: `query LatestBidsOnSelectedAuctions {
      ${populateAuctionQueries(auctionIds)}
    }
    
    fragment eventsFragment on events {
      auction_id
      bidder_address
      price
      timestamp
      current_price
      token {
        fa2_address
        token_id
        artist_address
        symbol
        name
      }
      owner_address
      seller_address
      artist_address
    }`
  });

const config = {
  url: 'https://unstable-do-not-use-in-production-api.teztok.com/v1/graphql',
  headers: {
    accept: 'application/json'
  }
};

export const getEvents = (pkh: string, timestamp?: string) => {
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

export const getAuctionsParticipation = (pkh: string, timestamp?: string) => {
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

export const getBidsByAuctions = (auctionIds: Array<number>) => {
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
