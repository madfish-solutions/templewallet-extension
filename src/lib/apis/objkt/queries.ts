import { gql } from '@apollo/client';

import { ADULT_CONTENT_TAGS } from './adult-tags';

export const buildGetCollectiblesQuery = () => gql`
  query MyQuery($where: token_bool_exp) {
    token(where: $where) {
      fa_contract
      token_id
      listings_active(order_by: { price_xtz: asc }) {
        currency_id
        price
      }
    }
  }
`;

export const ADULT_ATTRIBUTE_NAME = '__nsfw_';

export const buildGetUserAdultCollectiblesQuery = (address: string) =>
  gql`
    query MyQuery {
      token(
        where: {
          holders: { holder_address: { _eq: "${address}" } }
          _or: [
            { attributes: { attribute: { name: { _eq: "${ADULT_ATTRIBUTE_NAME}" } } } }
            { tags: { tag: { name: { _in: [${ADULT_CONTENT_TAGS}] } } } }
          ]
        }
      ) {
        fa_contract
        token_id
      }
    }
  `;
