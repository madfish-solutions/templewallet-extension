export const OBJKT_TOKEN_QUERY = `
  query WebWidgetObjktToken($fa: String!, $id: String!) {
    token(where: { fa_contract: { _eq: $fa }, token_id: { _eq: $id } }) {
      name
      supply
      mime
      thumbnail_uri
      display_uri
      artifact_uri
      flag
      fa {
        name
        logo
      }
      creators {
        holder {
          alias
          address
        }
      }
      listings_active(limit: 1, order_by: { price_xtz: asc }) {
        price
        price_xtz
        currency {
          symbol
          decimals
        }
      }
      english_auctions_active(limit: 1, order_by: { end_time: asc }) {
        reserve_xtz
        highest_bid_xtz
      }
      dutch_auctions_active(limit: 1, order_by: { end_time: asc }) {
        start_price_xtz
      }
    }
  }
`;

export const OBJKT_OWNED_QUERY = `
  query WebWidgetOwned($fa: String!, $id: String!, $addresses: [String!]!) {
    token(where: { fa_contract: { _eq: $fa }, token_id: { _eq: $id } }) {
      holders(where: { holder_address: { _in: $addresses } }) {
        quantity
      }
    }
  }
`;

interface ObjktCurrency {
  symbol: string;
  decimals: number;
}

interface ObjktListing {
  price: number;
  price_xtz: number | null;
  currency: ObjktCurrency | null;
}

interface ObjktEnglishAuction {
  reserve_xtz: number | null;
  highest_bid_xtz: number | null;
}

interface ObjktDutchAuction {
  start_price_xtz: number | null;
}

interface ObjktFa {
  name: string | null;
  logo: string | null;
}

interface ObjktCreator {
  holder: {
    alias: string | null;
    address: string;
  } | null;
}

export interface ObjktToken {
  name: string | null;
  supply: number | null;
  mime: string | null;
  thumbnail_uri: string | null;
  display_uri: string | null;
  artifact_uri: string | null;
  flag: string | null;
  fa: ObjktFa | null;
  creators: ObjktCreator[];
  listings_active: ObjktListing[];
  english_auctions_active: ObjktEnglishAuction[];
  dutch_auctions_active: ObjktDutchAuction[];
}

export interface ObjktTokenQueryResponse {
  data?: {
    token: ObjktToken[];
  };
}
