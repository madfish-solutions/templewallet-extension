import { ApolloClient, InMemoryCache, HttpLink, FetchResult, OperationVariables } from '@apollo/client';
import { isDefined } from '@rnw-community/shared';
import { DocumentNode } from 'graphql';
import { from } from 'rxjs';
import { filter } from 'rxjs/operators';

export const buildApolloClient = (uri: string) =>
  new TempleApolloClient({
    link: new HttpLink({ uri }),
    cache: new InMemoryCache()
  });

class TempleApolloClient<TCacheShape> extends ApolloClient<TCacheShape> {
  async fetch<T, TVars = OperationVariables>(query: DocumentNode, variables?: TVars) {
    const result: FetchResult<T> = await super.query<T, TVars>({
      query,
      variables,
      // Disabling cache as it creates bottlenecks (blocks thread) when fetching large data
      fetchPolicy: 'no-cache'
    });

    return result.data;
  }

  fetch$<T, TVars = OperationVariables>(query: DocumentNode, variables?: TVars) {
    return from(this.fetch<T, TVars>(query, variables)).pipe(filter(isDefined));
  }
}
