export const createEventsQuery = (pkh: string, timestamp = new Date().toISOString()) =>
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

export const createAuctionsParticipationQuery = (pkh: string, timestamp = new Date().toISOString()) =>
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

export const createBidsByAuctionQuery = (auctionIds: Array<number>) =>
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
