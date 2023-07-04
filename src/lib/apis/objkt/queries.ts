import { gql } from '@apollo/client';

export const buildGetAllUserCollectiblesQuery = (address: string) => {
  return gql`
    query MyQuery {
      token(where: {holders: {holder_address: {_eq: "${address}"}}}) {
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
