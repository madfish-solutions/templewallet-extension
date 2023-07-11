import { map, Observable } from 'rxjs';

import { fromFa2TokenSlug } from 'lib/assets/utils';

import { apolloObjktClient } from './constants';
import { CollectibleInfo, CollectibleInfoQueryResponse } from './intefaces';
import { buildGetCollectiblesQuery, buildGetCollectibleByAddressAndIdQuery } from './queries';

export { objktCurrencies } from './constants';

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

interface GetUserObjktCollectiblesResponse {
  token: UserObjktCollectible[];
}

interface ObjktListing {
  currency_id: number;
  price: number;
}

interface UserObjktCollectible {
  fa_contract: string;
  token_id: string;
  listings_active: ObjktListing[];
}

export const fetchObjktCollectibles$ = (slugs: string[]) => {
  const request = buildGetCollectiblesQuery();

  const queryVariables = {
    where: {
      _or: slugs.map(slug => {
        const { contract, id } = fromFa2TokenSlug(slug);

        return { fa_contract: { _eq: contract }, token_id: { _eq: String(id) } };
      })
    }
  };

  return apolloObjktClient.query<GetUserObjktCollectiblesResponse>(request, queryVariables);
};
