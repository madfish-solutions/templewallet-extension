import { combineEpics, Epic } from 'redux-observable';
import { catchError, concatMap, from, mergeMap, of } from 'rxjs';
import { ofType, toPayload } from 'ts-action-operators';

import { getEvmSingleChainNfts, getEvmSingleChainTokens } from 'lib/apis/temple/endpoints/evm-data';

import { loadSingleEvmChainCollectiblesActions, loadSingleEvmChainTokensActions } from './actions';
import { proceedLoadedEvmCollectiblesAction } from './collectibles/actions';
import { proceedLoadedEvmCollectiblesMetadataAction } from './collectibles-metadata/actions';
import { proceedLoadedEvmTokensAction } from './tokens/actions';
import { proceedLoadedEvmTokensBalancesAction } from './tokens-balances/actions';
import { proceedLoadedEvmExchangeRatesAction } from './tokens-exchange-rates/actions';
import { proceedLoadedEvmTokensMetadataAction } from './tokens-metadata/actions';

const loadEvmTokensDataEpic: Epic = action$ =>
  action$.pipe(
    ofType(loadSingleEvmChainTokensActions.submit),
    toPayload(),
    mergeMap(({ publicKeyHash, chainId }) =>
      from(getEvmSingleChainTokens(publicKeyHash, chainId)).pipe(
        concatMap(data => [
          proceedLoadedEvmTokensAction({ publicKeyHash, chainId, data }),
          proceedLoadedEvmTokensBalancesAction({ publicKeyHash, chainId, data }),
          proceedLoadedEvmTokensMetadataAction({ chainId, data }),
          proceedLoadedEvmExchangeRatesAction({ chainId, data }),
          loadSingleEvmChainTokensActions.success({ chainId })
        ]),
        catchError(err => of(loadSingleEvmChainTokensActions.fail({ chainId, error: err.message })))
      )
    )
  );

const loadEvmCollectiblesDataEpic: Epic = action$ =>
  action$.pipe(
    ofType(loadSingleEvmChainCollectiblesActions.submit),
    toPayload(),
    mergeMap(({ publicKeyHash, chainId }) =>
      from(getEvmSingleChainNfts(publicKeyHash, chainId)).pipe(
        concatMap(data => [
          proceedLoadedEvmCollectiblesAction({ publicKeyHash, chainId, data }),
          proceedLoadedEvmCollectiblesMetadataAction({ chainId, data }),
          loadSingleEvmChainCollectiblesActions.success({ chainId })
        ]),
        catchError(err => of(loadSingleEvmChainCollectiblesActions.fail({ chainId, error: err.message })))
      )
    )
  );

export const evmEpics = combineEpics(loadEvmTokensDataEpic, loadEvmCollectiblesDataEpic);
