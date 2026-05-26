export const OBJKT_TOKEN_QUERY = `
  query WebWidgetObjktToken($fa: String!, $id: String!) {
    token(where: { fa_contract: { _eq: $fa }, token_id: { _eq: $id } }) {
      name
      supply
      mime
      thumbnail_uri
      display_uri
      artifact_uri
      lowest_ask
      flag
      fa {
        name
        contract
        path
        floor_price
        editions
        owners
      }
      listings_active(limit: 1, order_by: { price_xtz: asc }) {
        price
        price_xtz
        amount_left
        currency {
          symbol
          decimals
        }
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
  amount_left: number;
  currency: ObjktCurrency | null;
}

interface ObjktFa {
  name: string | null;
  contract: string;
  path: string | null;
  floor_price: number | null;
  editions: number | null;
  owners: number | null;
}

export interface ObjktToken {
  name: string | null;
  supply: number | null;
  mime: string | null;
  thumbnail_uri: string | null;
  display_uri: string | null;
  artifact_uri: string | null;
  lowest_ask: number | null;
  flag: string | null;
  fa: ObjktFa | null;
  listings_active: ObjktListing[];
}

export interface ObjktTokenQueryResponse {
  data?: {
    token: ObjktToken[];
  };
}
