import { gql } from '@apollo/client';

import { buildApolloCustomClient } from 'lib/apis/apollo';

console.log('Hello OBJKT !');

const apolloClient = buildApolloCustomClient('https://data.objkt.com/v3/graphql');

export const getObjktNftContractAddress = async (
  collectionShortname: string,
  tokenId: number | string
): Promise<string | undefined> => {
  const request = buildGetListingQuery(collectionShortname, tokenId);
  const data = await apolloClient.query<{ fa: { contract: string }[] }>(request);

  return data.fa[0]?.contract;
};

/**
@example
```
query MyQuery {
  fa(
    where: {path: {_eq: "hicetnunc"}, tokens: {token_id: {_eq: "559520"}}, live: {_eq: true}}
  ) {
    contract
  }
}
```
*/
const buildGetListingQuery = (path: string, tokenId: number | string) => gql`
query MyQuery {
  fa(where: {path: {_eq: "${path}"}, tokens: {token_id: {_eq: "${tokenId}"}}, live: {_eq: true}}) {
    contract
    live
  }
}
`;
