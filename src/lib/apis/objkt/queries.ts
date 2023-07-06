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

export const buildGetCollectibleByAddressAndIdQuery = (address: string, tokenId: string) => gql`
  query MyQuery {
    token(where: { fa_contract: { _eq: "${address}" }, token_id: { _eq: "${tokenId}" } }) {
      description
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
    }
  }
`;
