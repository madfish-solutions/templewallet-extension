import { gql } from '@apollo/client';

import { fromFa2TokenSlug } from 'lib/assets/utils';

export const buildGetCollectiblesQuery = (slugs: string[]) => {
  const items = slugs.map(slug => fromFa2TokenSlug(slug));

  return gql`
    query MyQuery {
      token(where: {
        _or: [
          ${items
            .map(({ contract, id }) => `{ fa_contract: {_eq: "${contract}"}, token_id: {_eq: "${id}"} }`)
            .join(',\n')}
        ]
      }) {
        fa_contract
        token_id
        listings_active(order_by: {price_xtz: asc}) {
          currency_id
          price
        }
      }
    }
  `;
};
