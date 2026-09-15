import { Action } from 'redux';
import { combineEpics, Epic } from 'redux-observable';
import { concat, EMPTY, from, of } from 'rxjs';
import { catchError, concatMap, mergeMap, withLatestFrom } from 'rxjs/operators';
import { ofType } from 'ts-action-operators';

import { setEvmCollectiblesMetadataLoading } from 'app/store/evm/actions';
import { RootState } from 'app/store/root-state.type';
import { getEvmCollectiblesMetadata } from 'lib/apis/temple/endpoints/evm';
import { isSupportedChainId } from 'lib/apis/temple/endpoints/evm/api.utils';
import { fetchEvmCollectiblesMetadataFromChain } from 'lib/evm/on-chain/metadata';
import { EMPTY_FROZEN_ARRAY, isTruthy } from 'lib/utils';
import { EvmNetworkEssentials } from 'temple/networks';

import {
  loadEvmCollectiblesMetadataAction,
  processLoadedEvmCollectiblesMetadataAction,
  putEvmCollectiblesMetadataAction,
  updateEvmCollectiblesMetadataSessionAction
} from './actions';
import { getSlugsWithProperCollectibleMetadata } from './utils';

const canFetchCollectiblesMetadataFromApi = (chainId: number, isTestnetMode: boolean) =>
  isSupportedChainId(chainId) && !isTestnetMode;

const collectChainLoads = (
  publicKeyHash: HexString,
  chains: EvmNetworkEssentials[],
  loadAllChains: boolean,
  state: RootState
) => {
  const currentAccountCollectibles = state.evmAssets.collectibles[publicKeyHash];
  const { metadataRecord, lastFullLoadAccount, seenChainsByAccount, checkedSlugsByAccount } =
    state.evmCollectiblesMetadata;
  const isTestnetMode = state.settings.isTestnetModeEnabled;

  let nextLastFullLoadAccount = lastFullLoadAccount;
  let checkedSlugsByChain = { ...checkedSlugsByAccount[publicKeyHash] };
  const seenChains = new Set(seenChainsByAccount[publicKeyHash] ?? EMPTY_FROZEN_ARRAY);

  if (loadAllChains && lastFullLoadAccount !== publicKeyHash) {
    nextLastFullLoadAccount = publicKeyHash;
    checkedSlugsByChain = {};
    seenChains.clear();
  }

  const chainLoads = chains.flatMap(chain => {
    const { chainId } = chain;
    const chainCollectiblesRecord = currentAccountCollectibles?.[chainId];
    const chainMetadataRecord = metadataRecord[chainId];
    const allSlugs = chainCollectiblesRecord ? Object.keys(chainCollectiblesRecord) : [];
    const checkedSlugs = checkedSlugsByChain[chainId] ?? [];
    const slugsWithoutMeta = allSlugs.filter(slug => !chainMetadataRecord?.[slug] && !checkedSlugs.includes(slug));
    const loadEntireChain = !seenChains.has(chainId);

    seenChains.add(chainId);

    if (!loadEntireChain && !slugsWithoutMeta.length) {
      return [];
    }

    if (loadEntireChain && !canFetchCollectiblesMetadataFromApi(chainId, isTestnetMode) && !slugsWithoutMeta.length) {
      return [];
    }

    if (slugsWithoutMeta.length) {
      checkedSlugsByChain[chainId] = checkedSlugs.concat(slugsWithoutMeta);
    }

    return [{ chain, slugsWithoutMeta }];
  });

  return {
    chainLoads,
    session: {
      publicKeyHash,
      lastFullLoadAccount: nextLastFullLoadAccount,
      seenChains: Array.from(seenChains),
      checkedSlugsByChain
    }
  };
};

const loadEvmCollectiblesMetadataFromChain = async (slugsWithoutMeta: string[], chain: EvmNetworkEssentials) => {
  try {
    const records = await fetchEvmCollectiblesMetadataFromChain(chain, slugsWithoutMeta);

    return putEvmCollectiblesMetadataAction({ chainId: chain.chainId, records });
  } catch (error) {
    console.error(error);

    return undefined;
  }
};

const fetchChainCollectiblesMetadata = async (
  publicKeyHash: HexString,
  chain: EvmNetworkEssentials,
  slugsWithoutMeta: string[],
  isTestnetMode: boolean
) => {
  const { chainId } = chain;

  if (!isTestnetMode && isSupportedChainId(chainId)) {
    try {
      const data = await getEvmCollectiblesMetadata(publicKeyHash, chainId);
      const loadedSlugs = getSlugsWithProperCollectibleMetadata(data);

      const slugsLeftWithoutMeta = slugsWithoutMeta.filter(slug => !loadedSlugs.has(slug));
      const onChainAction = slugsLeftWithoutMeta.length
        ? await loadEvmCollectiblesMetadataFromChain(slugsLeftWithoutMeta, chain)
        : undefined;

      return [processLoadedEvmCollectiblesMetadataAction({ chainId, data }), onChainAction].filter(isTruthy);
    } catch {
      return slugsWithoutMeta.length
        ? [await loadEvmCollectiblesMetadataFromChain(slugsWithoutMeta, chain)].filter(isTruthy)
        : [];
    }
  }

  return slugsWithoutMeta.length
    ? [await loadEvmCollectiblesMetadataFromChain(slugsWithoutMeta, chain)].filter(isTruthy)
    : [];
};

const loadEvmCollectiblesMetadataEpic: Epic<Action, Action, RootState> = (action$, state$) =>
  action$.pipe(
    ofType(loadEvmCollectiblesMetadataAction),
    concatMap(action =>
      of(action).pipe(
        withLatestFrom(state$),
        mergeMap(([{ payload }, state]) => {
          const { publicKeyHash, chains, loadAllChains } = payload;
          const { chainLoads, session } = collectChainLoads(publicKeyHash, chains, loadAllChains, state);
          const sessionAction = updateEvmCollectiblesMetadataSessionAction(session);

          if (!chainLoads.length) {
            return of(sessionAction);
          }

          const isTestnetMode = state.settings.isTestnetModeEnabled;

          return concat(
            of(sessionAction, setEvmCollectiblesMetadataLoading(true)),
            from(chainLoads).pipe(
              mergeMap(({ chain, slugsWithoutMeta }) =>
                from(fetchChainCollectiblesMetadata(publicKeyHash, chain, slugsWithoutMeta, isTestnetMode)).pipe(
                  mergeMap(actions => from(actions)),
                  catchError(error => {
                    console.error(error);

                    return EMPTY;
                  })
                )
              )
            ),
            of(setEvmCollectiblesMetadataLoading(false))
          ).pipe(
            catchError(error => {
              console.error(error);

              return of(setEvmCollectiblesMetadataLoading(false));
            })
          );
        })
      )
    )
  );

export const evmCollectiblesMetadataEpics = combineEpics(loadEvmCollectiblesMetadataEpic);
