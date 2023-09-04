import { isDefined } from '@rnw-community/shared';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { apolloObjktClient } from './constants';
import { buildGetHoldersInfoQuery } from './queries';
import { TzProfile, TzProfilesQueryResponse } from './types';

export const fetchTzProfileInfo$ = (address: string): Observable<TzProfile> => {
  const request = buildGetHoldersInfoQuery(address);

  return apolloObjktClient.query<TzProfilesQueryResponse>(request, undefined, { nextFetchPolicy: 'no-cache' }).pipe(
    map(({ holder_by_pk }) => {
      return {
        logo: isDefined(holder_by_pk?.logo) ? holder_by_pk?.logo : undefined
      };
    })
  );
};
