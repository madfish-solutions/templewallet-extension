import { gql } from '@apollo/client';

export const buildGetCollectiblesQuery = () => gql`
  query MyQuery($where: token_bool_exp) {
    token(where: $where) {
      fa_contract
      token_id
      tags {
        tag {
          name
        }
      }
      attributes {
        attribute {
          name
        }
      }
      listings_active(order_by: { price_xtz: asc }) {
        currency_id
        price
      }
    }
  }
`;
