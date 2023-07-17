import { gql } from '@apollo/client';

export const buildGetCollectiblesQuery = () => gql`
  query MyQuery($where: token_bool_exp) {
    token(where: $where) {
      fa_contract
      token_id
      listings_active(order_by: { price_xtz: asc }) {
        currency_id
        price
      }
      description
      timestamp
      metadata
      creators {
        holder {
          address
          tzdomain
        }
      }
      fa {
        name
        logo
      }
      galleries {
        gallery {
          name
        }
      }
      offers_active(distinct_on: price_xtz) {
        buyer_address
        collection_offer
        price_xtz
        price
        bigmap_key
        marketplace_contract
        fa_contract
        currency_id
      }
      attributes {
        attribute {
          id
          name
          value
        }
      }
      supply
      royalties {
        decimals
        amount
      }
    }
  }
`;
