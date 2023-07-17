import { gql } from '@apollo/client';

export const buildGetCollectiblesQuery = () => gql`
  query MyQuery($token_where_or: token_bool_exp) {
    token(where: $token_where_or) {
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
        editions
      }
      galleries {
        gallery {
          name
          editions
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
          attribute_counts {
            editions
          }
        }
      }
      supply
      royalties {
        decimals
        amount
      }
    }
    gallery_attribute_count(where: { attribute: { tokens: { token: $token_where_or } } }) {
      attribute_id
      editions
    }
  }
`;
