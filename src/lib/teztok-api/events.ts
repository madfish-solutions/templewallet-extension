import axios from 'axios';

export type LatestEventsQuery = {
  __typename?: 'query_root';
  events: Array<{
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
  }>;
};

// const teztokApi = 'https://unstable-do-not-use-in-production-api.teztok.com/v1/graphql';

// export const teztokQuery = makeBuildQueryFn<Record<string, unknown>, any>(teztokApi);

// export const getNewsCount = teztokQuery<
//   {
//     welcome?: boolean;
//     platform?: PlatformType;
//     limit?: string;
//     page?: string;
//     timeLt?: string;
//     timeGt?: string;
//     sorted?: SortedBy;
//   },
//   { count: number }
// >('GET', '/news/count', ['welcome', 'platform', 'limit', 'timeGt', 'timeLt']);

const createData = (pkh: string, timestamp = new Date().toISOString()) =>
  JSON.stringify({
    query: `query LatestEvents($account: String!, $_lt: timestamptz) {
  events(
    limit: 100
    where: {
      token: { metadata_status: { _eq: "processed" } }
      _and: {
        _or: [
          { artist_address: { _eq: $account } }
          { owner_address: { _eq: $account } }
          { buyer_address: { _eq: $account } }
          { seller_address: { _eq: $account } }
          { from_address: { _eq: $account } }
          { to_address: { _eq: $account } }
        ]
      }
      timestamp: { _lt: $_lt }
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
    variables: { account: pkh, _lt: timestamp }
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
      data: createData(pkh, timestamp)
    })
    .then(x => ({ events: (x.data.data ?? { events: [] }).events }))
    .catch(() => {
      return { events: [] };
    });
};
