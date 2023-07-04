import { apolloObjktClient } from './constants';
import { buildGetAllUserCollectiblesQuery } from './queries';

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

export const fetchAllUserObjktCollectibles$ = (address: string) => {
  const request = buildGetAllUserCollectiblesQuery(address);

  return apolloObjktClient.query<GetUserObjktCollectiblesResponse>(request);
};
