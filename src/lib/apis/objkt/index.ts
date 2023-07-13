import { Observable, map } from 'rxjs';

import { fromFa2TokenSlug } from 'lib/assets/utils';

import { apolloObjktClient } from './constants';
import { buildGetCollectiblesQuery, buildGetUserAdultCollectiblesQuery } from './queries';

export { objktCurrencies } from './constants';

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

interface UserAdultCollectibles {
  fa_contract: string;
  token_id: string;
}

interface UserAdultCollectiblesQueryResponse {
  token: UserAdultCollectibles[];
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
export const fetchUserAdultCollectibles$ = (address: string): Observable<UserAdultCollectibles[]> => {
  const request = buildGetUserAdultCollectiblesQuery(address);

  return apolloObjktClient.query<UserAdultCollectiblesQueryResponse>(request).pipe(map(result => result.token));
};
