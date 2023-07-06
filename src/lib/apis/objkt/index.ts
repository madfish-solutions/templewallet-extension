import { apolloObjktClient } from './constants';
import { buildGetCollectiblesQuery } from './queries';

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

export const fetchObjktCollectibles$ = (slugs: string[]) => {
  const request = buildGetCollectiblesQuery(slugs);

  return apolloObjktClient.query<GetUserObjktCollectiblesResponse>(request);
};
