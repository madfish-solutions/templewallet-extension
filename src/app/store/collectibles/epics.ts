import { combineEpics, Epic } from 'redux-observable';
import { catchError, map, Observable, of, switchMap } from 'rxjs';
import { Action } from 'ts-action';
import { ofType, toPayload } from 'ts-action-operators';

import { fetchAllUserObjktCollectibles$ } from 'lib/apis/objkt';
import { toTokenSlug } from 'lib/assets';

import { loadCollectiblesDetailsActions } from './actions';
import { CollectibleDetailsRecord } from './state';

const loadCollectiblesDetailsEpic: Epic = (action$: Observable<Action>) =>
  action$.pipe(
    ofType(loadCollectiblesDetailsActions.submit),
    toPayload(),
    switchMap(publicKeyHash =>
      fetchAllUserObjktCollectibles$(publicKeyHash).pipe(
        map(data => {
          const entries = data.token.map(
            ({ fa_contract, token_id, lowest_ask }) =>
              [toTokenSlug(fa_contract, token_id), { floorPrice: lowest_ask }] as const
          );
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
