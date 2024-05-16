import { combineEpics, Epic } from 'redux-observable';
import { catchError, concatMap, from, mergeMap, of } from 'rxjs';
import { ofType, toPayload } from 'ts-action-operators';

import { getEvmCollectiblesMetadata, getEvmTokensMetadata } from 'lib/apis/temple/endpoints/evm/api';

import { loadEvmCollectiblesMetadataActions, loadEvmTokensMetadataActions } from './actions';
import { proceedLoadedEvmCollectiblesMetadataAction } from './collectibles-metadata/actions';
import { proceedLoadedEvmExchangeRatesAction } from './tokens-exchange-rates/actions';
import { proceedLoadedEvmTokensMetadataAction } from './tokens-metadata/actions';

const loadEvmTokensMetadataEpic: Epic = action$ =>
  action$.pipe(
    ofType(loadEvmTokensMetadataActions.submit),
    toPayload(),
    mergeMap(({ publicKeyHash, chainId }) =>
      from(getEvmTokensMetadata(publicKeyHash, chainId)).pipe(
        concatMap(data => [
          proceedLoadedEvmTokensMetadataAction({ chainId, data }),
          proceedLoadedEvmExchangeRatesAction({ chainId, data }),
          loadEvmTokensMetadataActions.success({ chainId })
        ]),
        catchError(err => of(loadEvmTokensMetadataActions.fail({ chainId, error: err.message })))
      )
    )
  );

const loadEvmCollectiblesMetadataEpic: Epic = action$ =>
  action$.pipe(
    ofType(loadEvmCollectiblesMetadataActions.submit),
    toPayload(),
    mergeMap(({ publicKeyHash, chainId }) =>
      from(getEvmCollectiblesMetadata(publicKeyHash, chainId)).pipe(
        concatMap(data => [
          proceedLoadedEvmCollectiblesMetadataAction({ chainId, data }),
          loadEvmCollectiblesMetadataActions.success({ chainId })
        ]),
        catchError(err => of(loadEvmCollectiblesMetadataActions.fail({ chainId, error: err.message })))
      )
    )
  );

export const evmEpics = combineEpics(loadEvmTokensMetadataEpic, loadEvmCollectiblesMetadataEpic);
