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
      mime
      artifact_uri
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
      offers_active(order_by: { price_xtz: desc }) {
        buyer_address
        price
        currency_id
        bigmap_key
        marketplace_contract
      }
    }
  }
`;
