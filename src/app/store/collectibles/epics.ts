import { combineEpics, Epic } from 'redux-observable';
import { catchError, map, Observable, of, switchMap } from 'rxjs';
import { Action } from 'ts-action';
import { ofType, toPayload } from 'ts-action-operators';

import { fetchObjktCollectibles$ } from 'lib/apis/objkt';
import { toTokenSlug } from 'lib/assets';

import { loadCollectiblesDetailsActions } from './actions';
import { CollectibleDetailsRecord } from './state';
import { conertCollectibleObjktInfoToStateDetailsType } from './utils';

const loadCollectiblesDetailsEpic: Epic = (action$: Observable<Action>) =>
  action$.pipe(
    ofType(loadCollectiblesDetailsActions.submit),
    toPayload(),
    switchMap(slugs =>
      fetchObjktCollectibles$(slugs).pipe(
        map(data => {
          console.log('data:', data);

          const entries = data.token.map(info => {
            const slug = toTokenSlug(info.fa_contract, info.token_id);
            const details = conertCollectibleObjktInfoToStateDetailsType(info);

            return [slug, details] as const;
          });

          const details: CollectibleDetailsRecord = Object.fromEntries(entries);

          return loadCollectiblesDetailsActions.success(details);
        }),
        catchError((error: unknown) =>
          of(loadCollectiblesDetailsActions.fail(error instanceof Error ? error.message : 'Unknown error'))
        )
      )
    )
  );

export const collectiblesEpics = combineEpics(loadCollectiblesDetailsEpic);
