import { combineEpics, Epic } from 'redux-observable';
import { catchError, concatMap, from, mergeMap, of } from 'rxjs';
import { ofType, toPayload } from 'ts-action-operators';

import { getEvmSingleChainData } from 'lib/apis/temple/endpoints/evm-data';

import { loadSingleEvmChainDataActions } from './actions';
import { proceedLoadedEvmAssetsAction } from './assets/actions';
import { proceedLoadedEvmBalancesAction } from './balances/actions';
import { proceedLoadedEvmExchangeRatesAction } from './currency/actions';
import { proceedLoadedEvmTokensMetadataAction } from './tokens-metadata/actions';

const loadEVMDataEpic: Epic = action$ =>
  action$.pipe(
    ofType(loadSingleEvmChainDataActions.submit),
    toPayload(),
    mergeMap(({ publicKeyHash, chainId }) =>
      from(getEvmSingleChainData(publicKeyHash, chainId)).pipe(
        concatMap(data => [
          proceedLoadedEvmAssetsAction({ publicKeyHash, chainId, data }),
          proceedLoadedEvmBalancesAction({ publicKeyHash, chainId, data }),
          proceedLoadedEvmTokensMetadataAction({ chainId, data }),
          proceedLoadedEvmExchangeRatesAction({ chainId, data }),
          loadSingleEvmChainDataActions.success({ chainId })
        ]),
        catchError(err => of(loadSingleEvmChainDataActions.fail({ chainId, error: err.message })))
      )
    )
  );

export const evmEpics = combineEpics(loadEVMDataEpic);
