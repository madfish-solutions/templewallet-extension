import { gql } from '@apollo/client';

export const LATEST_EVENTS_LIST = gql`
  query LatestEvents($account: String!) {
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
      }
      amount
      owner_address
      from_address
      to_address
      bidder_address
      buyer_address
      seller_address
      artist_address
      opid
      ophash
    }
  }
`;
