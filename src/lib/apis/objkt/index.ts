import { apolloObjktClient } from './constants';
import { buildGetAllUserCollectiblesQuery } from './queries';

interface GetUserObjktCollectiblesResponse {
  token: UserObjktCollectible[];
}

interface UserObjktCollectible {
  fa_contract: string;
  token_id: string;
  lowest_ask: number | null;
}

export const fetchAllUserObjktCollectibles$ = (address: string) => {
  const request = buildGetAllUserCollectiblesQuery(address);

  return apolloObjktClient.query<GetUserObjktCollectiblesResponse>(request);
};
