import { Action } from 'redux';
import { combineEpics, Epic } from 'redux-observable';
import { REHYDRATE } from 'redux-persist';
import { catchError, EMPTY, exhaustMap, filter, from, interval, map, merge, of, withLatestFrom } from 'rxjs';
import { ofType } from 'ts-action-operators';

import { getCrossChainExchangeStatus } from 'lib/apis/exolix/cross-chain';
import { isTerminalPhase, mapExolixStatusToPhase } from 'lib/cross-chain';

import type { RootState } from '../root-state.type';

import { monitorCrossChainExchangesAction, updateCrossChainExchangeAction } from './actions';
import { CrossChainExchange } from './state';

const POLL_INTERVAL_MS = 5_000;

const selectAllExchanges = (state: RootState): CrossChainExchange[] => {
  const s = state.crossChainSend;
  return s.ids.map(id => s.byId[id]).filter(Boolean);
};

const selectActiveExchanges = (state: RootState): CrossChainExchange[] =>
  selectAllExchanges(state).filter(e => !isTerminalPhase(e.phase));

const periodicCrossChainMonitorEpic: Epic<Action, Action, RootState> = (action$, state$) => {
  const tick$ = interval(POLL_INTERVAL_MS).pipe(
    withLatestFrom(state$),
    filter(([, state]) => selectActiveExchanges(state).length > 0),
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
    // exhaustMap drops new ticks while a poll cycle is in flight — prevents request storms when Exolix is slow.
    exhaustMap(([, state]) => {
      const active = selectActiveExchanges(state);
      if (active.length === 0) return EMPTY;

      return merge(
        ...active.map(exchange =>
          from(getCrossChainExchangeStatus(exchange.id)).pipe(
            map(data => {
              const now = Date.now();
              const nextPhase = mapExolixStatusToPhase(data.status, exchange.phase);
              return updateCrossChainExchangeAction({
                id: exchange.id,
                phase: nextPhase,
                exolixStatus: data.status,
                hashIn: data.hashIn ?? undefined,
                hashOut: data.hashOut ?? undefined,
                refundHash: data.refundHash ?? undefined,
                toAmountActual: data.amountTo ? String(data.amountTo) : undefined,
                updatedAt: now,
                completedAt: isTerminalPhase(nextPhase) ? now : undefined
              });
            }),
            catchError(() => of())
          )
        )
      );
    })
  );

export const crossChainSendEpics = combineEpics(periodicCrossChainMonitorEpic, monitorCrossChainExchangesEpic);
