import { combineEpics } from 'redux-observable';
import { Observable, EMPTY } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Action } from 'ts-action';
import { ofType } from 'ts-action-operators';

import { withSelectedCounter } from '../../utils/wallet.utils';
import { RootState } from '../create-store';
import { increaseCounterAction } from './wallet-actions';

const logCounterIncreaseEpic = (action$: Observable<Action>, state$: Observable<RootState>) =>
  action$.pipe(
    ofType(increaseCounterAction),
    withSelectedCounter(state$),
    switchMap(([, counter]) => {
      console.log(counter);

      return EMPTY;
    })
  );

export const walletEpics = combineEpics(logCounterIncreaseEpic);
