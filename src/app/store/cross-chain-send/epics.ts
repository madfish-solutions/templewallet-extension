import { Action } from 'redux';
import { combineEpics, Epic } from 'redux-observable';
import { catchError, EMPTY, filter, from, interval, map, mergeMap, of, withLatestFrom } from 'rxjs';
import { ofType } from 'ts-action-operators';

import { getCrossChainExchangeStatus } from 'lib/apis/exolix/cross-chain';
import { OrderStatusEnum } from 'lib/apis/exolix/types';

import type { RootState } from '../root-state.type';

import { monitorCrossChainExchangesAction, updateCrossChainExchangeAction } from './actions';
import { CrossChainExchange, CrossChainPhase } from './state';

const POLL_INTERVAL_MS = 5_000;

const TERMINAL_PHASES: CrossChainPhase[] = ['COMPLETED', 'FAILED'];

const isTerminal = (phase: CrossChainPhase) => TERMINAL_PHASES.includes(phase);

const mapExolixStatusToPhase = (status: string, previous: CrossChainPhase): CrossChainPhase => {
  switch (status) {
    case OrderStatusEnum.WAIT:
      return previous === 'TX_CONFIRMED' ? 'TX_CONFIRMED' : 'PENDING_TX';
    case OrderStatusEnum.CONFIRMATION:
      return 'TX_CONFIRMED';
    case OrderStatusEnum.EXCHANGING:
      return 'EXCHANGING';
    case OrderStatusEnum.SUCCESS:
      return 'COMPLETED';
    case OrderStatusEnum.OVERDUE:
    case OrderStatusEnum.REFUNDED:
      return 'FAILED';
    default:
      return previous;
  }
};

const selectAllExchanges = (state: RootState): CrossChainExchange[] => {
  const s = state.crossChainSend;
  return s.ids.map(id => s.byId[id]).filter(Boolean);
};

const selectActiveExchanges = (state: RootState): CrossChainExchange[] =>
  selectAllExchanges(state).filter(e => !isTerminal(e.phase));

const periodicCrossChainMonitorEpic: Epic<Action, Action, RootState> = (_, state$) =>
  interval(POLL_INTERVAL_MS).pipe(
    withLatestFrom(state$),
    filter(([, state]) => selectActiveExchanges(state).length > 0),
    map(() => monitorCrossChainExchangesAction())
  );

const monitorCrossChainExchangesEpic: Epic<Action, Action, RootState> = (action$, state$) =>
  action$.pipe(
    ofType(monitorCrossChainExchangesAction),
    withLatestFrom(state$),
    mergeMap(([, state]) => {
      const active = selectActiveExchanges(state);
      if (active.length === 0) return EMPTY;

      return from(active).pipe(
        mergeMap(exchange =>
          from(getCrossChainExchangeStatus(exchange.id)).pipe(
            mergeMap(data => {
              const now = Date.now();
              const nextPhase = mapExolixStatusToPhase(data.status, exchange.phase);

              return of(
                updateCrossChainExchangeAction({
                  id: exchange.id,
                  phase: nextPhase,
                  exolixStatus: data.status,
                  hashIn: data.hashIn ?? undefined,
                  hashOut: data.hashOut ?? undefined,
                  refundHash: data.refundHash ?? undefined,
                  toAmountActual: data.amountTo ? String(data.amountTo) : undefined,
                  updatedAt: now,
                  completedAt: isTerminal(nextPhase) ? now : undefined
                })
              );
            }),
            catchError(error => {
              console.warn(`Failed to poll cross-chain exchange ${exchange.id}: `, error);
              return of();
            })
          )
        )
      );
    })
  );

export const crossChainSendEpics = combineEpics(periodicCrossChainMonitorEpic, monitorCrossChainExchangesEpic);
