import { combineEpics, Epic } from 'redux-observable';
import { catchError, map, Observable, of, switchMap } from 'rxjs';
import { Action } from 'ts-action';
import { ofType, toPayload } from 'ts-action-operators';

import { fetchObjktCollectibles$ } from 'lib/apis/objkt';
import { toTokenSlug } from 'lib/assets';

import { loadCollectiblesDetailsActions } from './actions';
import { CollectibleDetails, CollectibleDetailsRecord } from './state';
import { convertCollectibleObjktInfoToStateDetailsType } from './utils';

const loadCollectiblesDetailsEpic: Epic = (action$: Observable<Action>) =>
  action$.pipe(
    ofType(loadCollectiblesDetailsActions.submit),
    toPayload(),
    switchMap(slugs =>
      fetchObjktCollectibles$(slugs).pipe(
        map(data => {
          const entries: [string, CollectibleDetails | null][] = data.token.map(info => {
            const slug = toTokenSlug(info.fa_contract, info.token_id);
            const details = convertCollectibleObjktInfoToStateDetailsType(info, data.gallery_attribute_count);

            return [slug, details];
          });

          for (const slug of slugs) {
            if (!data.token.some(({ fa_contract, token_id }) => toTokenSlug(fa_contract, token_id) === slug))
              entries.push([slug, null]);
          }

          const details: CollectibleDetailsRecord = Object.fromEntries(entries);

          return loadCollectiblesDetailsActions.success({ details, timestamp: Date.now() });
        }),
        catchError((error: unknown) => {
          console.error(error);
          return of(loadCollectiblesDetailsActions.fail(error instanceof Error ? error.message : 'Unknown error'));
        })
      )
    )
  );

export const collectiblesEpics = combineEpics(loadCollectiblesDetailsEpic);
