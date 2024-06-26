import { combineEpics, Epic } from 'redux-observable';
import { catchError, map, of, switchMap } from 'rxjs';
import { ofType, toPayload } from 'ts-action-operators';

import { fetchObjktCollectibles$ } from 'lib/apis/objkt';
import { toTokenSlug } from 'lib/assets';

import { loadCollectiblesDetailsActions } from './actions';
import type { CollectibleDetailsRecord } from './state';
import { convertCollectibleObjktInfoToStateDetailsType } from './utils';

const loadCollectiblesDetailsEpic: Epic = action$ =>
  action$.pipe(
    ofType(loadCollectiblesDetailsActions.submit),
    toPayload(),
    switchMap(slugs =>
      fetchObjktCollectibles$(slugs).pipe(
        map(data => {
          const details: CollectibleDetailsRecord = {};

          for (const info of data.tokens) {
            const slug = toTokenSlug(info.fa_contract, info.token_id);
            const itemDetails = convertCollectibleObjktInfoToStateDetailsType(info, data.galleriesAttributesCounts);

            details[slug] = itemDetails;
          }

          for (const slug of slugs) {
            if (!details[slug]) details[slug] = null;
          }

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
