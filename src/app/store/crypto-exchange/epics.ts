import { combineEpics, Epic } from 'redux-observable';
import { catchError, from, map, of, switchMap } from 'rxjs';
import { ofType } from 'ts-action-operators';

import { getAllCurrencies } from 'lib/apis/exolix/utils';

import { loadExolixCurrenciesActions } from './actions';

const getExolixCurrencies$ = () => from(getAllCurrencies());

const loadExolixCurrenciesEpic: Epic = action$ =>
  action$.pipe(
    ofType(loadExolixCurrenciesActions.submit),
    switchMap(() =>
      getExolixCurrencies$().pipe(
        map(currencies => loadExolixCurrenciesActions.success(currencies)),
        catchError(error => of(loadExolixCurrenciesActions.fail(error.message)))
      )
    )
  );

export const cryptoExchangeEpics = combineEpics(loadExolixCurrenciesEpic);
