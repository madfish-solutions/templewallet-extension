import { combineEpics, Epic } from 'redux-observable';
import { catchError, map, of, switchMap } from 'rxjs';
import { ofType, toPayload } from 'ts-action-operators';

import { fetchObjktCollectibles$ } from 'lib/apis/objkt';
import { toTokenSlug } from 'lib/assets';

import { loadCollectiblesDetailsActions } from './actions';
import { CollectibleDetails, CollectibleDetailsRecord } from './state';
import { convertCollectibleObjktInfoToStateDetailsType } from './utils';

const loadCollectiblesDetailsEpic: Epic = action$ =>
  action$.pipe(
    ofType(loadCollectiblesDetailsActions.submit),
    toPayload(),
    switchMap(slugs =>
      fetchObjktCollectibles$(slugs).pipe(
        map(data => {
          const entries: [string, CollectibleDetails | null][] = data.tokens.map(info => {
            const slug = toTokenSlug(info.fa_contract, info.token_id);
            const details = convertCollectibleObjktInfoToStateDetailsType(info, data.galleriesAttributesCounts);

            return [slug, details];
          });

          for (const slug of slugs) {
            if (!data.tokens.some(({ fa_contract, token_id }) => toTokenSlug(fa_contract, token_id) === slug))
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
