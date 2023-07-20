import { TezosToolkit } from '@taquito/taquito';

import { fromFa2TokenSlug } from 'lib/assets/utils';

import { apolloObjktClient, OBJKT_CONTRACT } from './constants';
import { buildGetCollectiblesQuery } from './queries';
import type { FxHashContractInterface, GetUserObjktCollectiblesResponse, ObjktContractInterface } from './types';

export type { UserObjktCollectible } from './types';
export { objktCurrencies } from './constants';

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

export const getObjktMarketplaceContract = (tezos: TezosToolkit, address?: string) =>
  tezos.contract.at<ObjktContractInterface | FxHashContractInterface>(address ?? OBJKT_CONTRACT);
