import { gql } from '@apollo/client';

export const buildGetHoldersInfoQuery = (address: string) => gql`
  query MyQuery {
    holder_by_pk(address: "${address}") {
      logo
    }
  }
`;
