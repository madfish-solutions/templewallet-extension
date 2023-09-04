import { isDefined } from '@rnw-community/shared';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { apolloObjktClient } from './constants';
import { buildGetHoldersInfoQuery } from './queries';
import { TzProfile, TzProfilesQueryResponse } from './types';

export const fetchTzProfilesInfo$ = (address: string): Observable<TzProfile> => {
  const request = buildGetHoldersInfoQuery(address);

  return apolloObjktClient.query<TzProfilesQueryResponse>(request, undefined, { nextFetchPolicy: 'no-cache' }).pipe(
    map(result => {
      const { logo } = result.holder_by_pk;

      //check for nullable value
      return {
        logo: isDefined(logo) ? logo : undefined
      };
    })
  );
};
