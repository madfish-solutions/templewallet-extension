import { fromFa2TokenSlug } from 'lib/assets/utils';

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

interface Name {
  name: string;
}

interface Tag {
  tag: Name;
}

interface Attribute {
  attribute: Name;
}

interface UserObjktCollectible {
  fa_contract: string;
  token_id: string;
  tags: Array<Tag>;
  attributes: Array<Attribute>;
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
