import { map, Observable } from 'rxjs';

import { apolloObjktClient } from './constants';
import { CollectibleInfo, CollectibleInfoQueryResponse } from './intefaces';
import { buildGetCollectibleByAddressAndIdQuery } from './queries';

export const fetchCollectibleInfo$ = (address: string, tokenId: string): Observable<CollectibleInfo> => {
  const request = buildGetCollectibleByAddressAndIdQuery(address, tokenId);

  return apolloObjktClient.query<CollectibleInfoQueryResponse>(request).pipe(
    map(result => {
      const { description, creators, fa, galleries } = result.token[0];

      return {
        description,
        creators,
        fa: {
          name: fa.name,
          logo: fa.logo
        },
        galleries
      };
    })
  );
};
