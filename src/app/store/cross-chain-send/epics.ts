import { Action } from 'redux';
import { combineEpics, Epic } from 'redux-observable';
import { REHYDRATE } from 'redux-persist';
import {
  catchError,
  distinctUntilChanged,
  EMPTY,
  exhaustMap,
  filter,
  from,
  interval,
  map,
  merge,
  switchMap,
  timeout,
  withLatestFrom
} from 'rxjs';
import { ofType } from 'ts-action-operators';

import { getExchangeData } from 'lib/apis/exolix/utils';
import { isTerminalPhase, mapExolixStatusToPhase } from 'lib/cross-chain';

import type { RootState } from '../root-state.type';

import { monitorCrossChainExchangesAction, updateCrossChainExchangeAction } from './actions';
import { CrossChainExchange } from './state';

const POLL_INTERVAL_MS = 5_000;
const REQUEST_TIMEOUT_MS = 15_000;

const selectActiveExchanges = (state: RootState): CrossChainExchange[] => {
  const s = state.crossChainSend;
  const active: CrossChainExchange[] = [];
  for (const id of s.ids) {
    const ex = s.byId[id];
    if (ex && !isTerminalPhase(ex.phase)) active.push(ex);
  }
  return active;
};

const periodicCrossChainMonitorEpic: Epic<Action, Action, RootState> = (action$, state$) => {
  // Only run the polling timer while there's at least one active exchange.
  const tick$ = state$.pipe(
    map(state => selectActiveExchanges(state).length > 0),
    distinctUntilChanged(),
    switchMap(hasActive => (hasActive ? interval(POLL_INTERVAL_MS) : EMPTY)),
    map(() => monitorCrossChainExchangesAction())
  );

  // Re-arm polling after rehydrating (service worker restart, popup reopen), so persisted active
  // exchanges advance without waiting for the next interval tick.
  const rehydrate$ = action$.pipe(
    filter(action => action.type === REHYDRATE),
    withLatestFrom(state$),
    filter(([, state]) => selectActiveExchanges(state).length > 0),
    map(() => monitorCrossChainExchangesAction())
  );

  return merge(tick$, rehydrate$);
};

const monitorCrossChainExchangesEpic: Epic<Action, Action, RootState> = (action$, state$) =>
  action$.pipe(
    ofType(monitorCrossChainExchangesAction),
    withLatestFrom(state$),
    exhaustMap(([, state]) => {
      const active = selectActiveExchanges(state);
      if (active.length === 0) return EMPTY;

      return merge(
        ...active.map(exchange =>
          from(getExchangeData(exchange.id)).pipe(
            timeout(REQUEST_TIMEOUT_MS),
            map(data =>
              updateCrossChainExchangeAction({
                id: exchange.id,
                phase: mapExolixStatusToPhase(data.status, exchange.phase),
                exolixStatus: data.status,
                hashIn: data.hashIn ?? undefined,
                hashOut: data.hashOut ?? undefined,
                refundHash: data.refundHash ?? undefined,
                toAmountActual: data.amountTo ? String(data.amountTo) : undefined,
                updatedAt: Date.now()
              })
            ),
            catchError(() => EMPTY)
          )
        )
      );
    })
  );

export const crossChainSendEpics = combineEpics(periodicCrossChainMonitorEpic, monitorCrossChainExchangesEpic);
