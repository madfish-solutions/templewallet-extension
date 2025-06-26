import { combineEpics, Epic } from 'redux-observable';
import { catchError, from, map, of, switchMap } from 'rxjs';
import { ofType } from 'ts-action-operators';

import { getAllCurrencies } from 'lib/apis/exolix/utils';
import { getExolixNetworksMap$ } from 'lib/apis/temple/endpoints/get-exolix-networks-map';

import { loadExolixCurrenciesActions, loadExolixNetworksMapActions } from './actions';

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

const loadExolixNetworksMapEpic: Epic = action$ =>
  action$.pipe(
    ofType(loadExolixNetworksMapActions.submit),
    switchMap(() =>
      getExolixNetworksMap$().pipe(
        map(data => loadExolixNetworksMapActions.success(data)),
        catchError(err => of(loadExolixNetworksMapActions.fail(err.message)))
      )
    )
  );

export const cryptoExchangeEpics = combineEpics(loadExolixCurrenciesEpic, loadExolixNetworksMapEpic);
