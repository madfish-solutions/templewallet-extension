import { combineEpics, Epic } from 'redux-observable';
import { catchError, concatMap, from, of } from 'rxjs';
import { ofType, toPayload } from 'ts-action-operators';

import { getEvmCollectiblesMetadata, getEvmBalances, getEvmTokensMetadata } from 'lib/apis/temple/endpoints/evm-data';

import { loadEvmCollectiblesMetadataActions, loadEvmBalancesActions, loadEvmTokensMetadataActions } from './actions';
import { proceedLoadedEvmAssetsAction } from './assets/actions';
import { proceedLoadedEvmAssetsBalancesAction } from './balances/actions';
import { proceedLoadedEvmCollectiblesMetadataAction } from './collectibles-metadata/actions';
import { proceedLoadedEvmExchangeRatesAction } from './tokens-exchange-rates/actions';
import { proceedLoadedEvmTokensMetadataAction } from './tokens-metadata/actions';

const loadEvmBalancesEpic: Epic = action$ =>
  action$.pipe(
    ofType(loadEvmBalancesActions.submit),
    toPayload(),
    concatMap(({ publicKeyHash, chainId }) =>
      from(getEvmBalances(publicKeyHash, chainId)).pipe(
        concatMap(data => [
          proceedLoadedEvmAssetsAction({ publicKeyHash, chainId, data }),
          proceedLoadedEvmAssetsBalancesAction({ publicKeyHash, chainId, data }),
          loadEvmBalancesActions.success({ chainId })
        ]),
        catchError(err => of(loadEvmBalancesActions.fail({ chainId, error: err.message })))
      )
    )
  );

const loadEvmTokensMetadataEpic: Epic = action$ =>
  action$.pipe(
    ofType(loadEvmTokensMetadataActions.submit),
    toPayload(),
    concatMap(({ publicKeyHash, chainId }) =>
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
    concatMap(({ publicKeyHash, chainId }) =>
      from(getEvmCollectiblesMetadata(publicKeyHash, chainId)).pipe(
        concatMap(data => [
          proceedLoadedEvmCollectiblesMetadataAction({ chainId, data }),
          loadEvmCollectiblesMetadataActions.success({ chainId })
        ]),
        catchError(err => of(loadEvmCollectiblesMetadataActions.fail({ chainId, error: err.message })))
      )
    )
  );

export const evmEpics = combineEpics(loadEvmBalancesEpic, loadEvmTokensMetadataEpic, loadEvmCollectiblesMetadataEpic);
