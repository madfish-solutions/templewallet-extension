import { combineEpics } from 'redux-observable';
import { forkJoin, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Action } from 'ts-action';
import { ofType } from 'ts-action-operators';

import { loadTokensApyActions } from './actions';
import { fetchTzBtcApy$, fetchKUSDApy$, fetchUSDTApy$ } from './utils';

const loadTokensApyEpic = (action$: Observable<Action>) =>
  action$.pipe(
    ofType(loadTokensApyActions.submit),
    switchMap(() =>
      forkJoin([fetchTzBtcApy$(), fetchKUSDApy$(), fetchUSDTApy$()]).pipe(
        map(responses => loadTokensApyActions.success(Object.assign({}, ...responses)))
      )
    )
  );

export const dAppsEpics = combineEpics(loadTokensApyEpic);
