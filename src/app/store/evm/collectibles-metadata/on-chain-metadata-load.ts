import { Action } from 'redux';
import { Epic } from 'redux-observable';
import { EMPTY, from, timer } from 'rxjs';
import { catchError, concatMap, filter, map, mergeMap, takeUntil } from 'rxjs/operators';

import { RootState } from 'app/store/root-state.type';
import { OpenseaNftRef } from 'lib/apis/temple/endpoints/evm';
import { toTokenSlug } from 'lib/assets';
import { fetchEvmCollectiblesMetadataFromChain } from 'lib/evm/on-chain/metadata';
import { EvmCollectibleMetadata } from 'lib/metadata/types';
import { EvmNetworkEssentials } from 'temple/networks';

import {
  continueEvmCollectiblesOnChainLoadAction,
  EvmCollectiblesMetadataSession,
  putEvmCollectiblesMetadataAction
} from './actions';
import { cancelMetadataLoads, createMetadataLoadQueue, metadataLoadWasCancelled, noteMetadataLoad } from './load-queue';
import { emptyAfterLoadError, isCollectiblesListingChange } from './metadata-load-shared';
import {
  ON_CHAIN_COLLECTIBLES_BATCH_DELAY_MS,
  DeferredEvmCollectibleOnChainLoad,
  splitOnChainCollectibleBatch
} from './on-chain-queue';

const loadEvmCollectiblesMetadataFromChain = async (slugsWithoutMeta: string[], chain: EvmNetworkEssentials) => {
  try {
    const records = await fetchEvmCollectiblesMetadataFromChain(chain, slugsWithoutMeta);

    return putEvmCollectiblesMetadataAction({ chainId: chain.chainId, records });
  } catch (error) {
    console.error(error);

    return undefined;
  }
};

const loadOnChainCollectibleBatch = async (items: readonly DeferredEvmCollectibleOnChainLoad[]) => {
  const actions: Action[] = [];
  if (!items.length) return actions;

  const { now, later } = splitOnChainCollectibleBatch(items);
  const byChainId = new Map<number, { chain: EvmNetworkEssentials; slugs: string[] }>();

  for (const item of now) {
    const group = byChainId.get(item.chain.chainId);

    if (group) group.slugs.push(item.slug);
    else byChainId.set(item.chain.chainId, { chain: item.chain, slugs: [item.slug] });
  }

  const loaded = await Promise.all(
    Array.from(byChainId.values(), ({ chain, slugs }) => loadEvmCollectiblesMetadataFromChain(slugs, chain))
  ).catch(error => {
    console.error(error);

    return [];
  });

  for (const action of loaded) {
    if (action) actions.push(action);
  }

  if (later.length) actions.push(continueEvmCollectiblesOnChainLoadAction({ items: later }));

  return actions;
};

export const slugSetsFromRecords = (recordsByChain: Record<number, StringRecord<EvmCollectibleMetadata>>) => {
  const resolvedByChain: Record<number, Set<string>> = {};

  for (const chainIdKey of Object.keys(recordsByChain)) {
    resolvedByChain[Number(chainIdKey)] = new Set(Object.keys(recordsByChain[Number(chainIdKey)]));
  }

  return resolvedByChain;
};

export const visibleOnChainItems = (
  chains: readonly EvmNetworkEssentials[],
  visibleNftRefs: readonly OpenseaNftRef[],
  metadataByChain: RootState['evmCollectiblesMetadata']['metadataRecord'],
  attemptedByChain: Record<number, readonly string[]> | undefined,
  resolvedByChain?: Record<number, ReadonlySet<string> | undefined>
) => {
  const chainById = new Map(chains.map(chain => [chain.chainId, chain]));
  const seen = new Set<string>();
  const items: DeferredEvmCollectibleOnChainLoad[] = [];

  for (const ref of visibleNftRefs) {
    const chain = chainById.get(ref.chainId);
    if (!chain) continue;

    const slug = toTokenSlug(ref.contractAddress, ref.tokenId);
    const key = `${ref.chainId}:${slug}`;
    if (seen.has(key)) continue;
    if (metadataByChain[ref.chainId]?.[slug]) continue;
    if (resolvedByChain?.[ref.chainId]?.has(slug)) continue;
    if ((attemptedByChain?.[ref.chainId] ?? []).includes(slug)) continue;

    seen.add(key);
    items.push({ chain, slug });
  }

  return items;
};

export const withOnChainSlugs = (
  session: EvmCollectiblesMetadataSession,
  items: readonly DeferredEvmCollectibleOnChainLoad[]
): EvmCollectiblesMetadataSession => {
  if (!items.length) return session;

  const onChainSlugsByChain = { ...session.onChainSlugsByChain };

  for (const item of items) {
    const previous = onChainSlugsByChain[item.chain.chainId] ?? [];
    if (previous.includes(item.slug)) continue;

    onChainSlugsByChain[item.chain.chainId] = previous.concat(item.slug);
  }

  return { ...session, onChainSlugsByChain };
};

export const queueVisibleOnChainReads = async (items: DeferredEvmCollectibleOnChainLoad[]): Promise<Action[]> => {
  if (!items.length) return [];

  return loadOnChainCollectibleBatch(items);
};

const onChainLoadQueue = createMetadataLoadQueue();

type OnChainLoadEvent =
  | { kind: 'cancel' }
  | { kind: 'continue'; action: ReturnType<typeof continueEvmCollectiblesOnChainLoadAction>; id: number };

export const continueEvmCollectiblesOnChainLoadEpic: Epic<Action, Action, RootState> = action$ =>
  action$.pipe(
    filter(action => continueEvmCollectiblesOnChainLoadAction.match(action) || isCollectiblesListingChange(action)),
    map((action): OnChainLoadEvent => {
      if (!continueEvmCollectiblesOnChainLoadAction.match(action)) {
        cancelMetadataLoads(onChainLoadQueue);

        return { kind: 'cancel' };
      }

      return { kind: 'continue', action, id: noteMetadataLoad(onChainLoadQueue) };
    }),
    concatMap(event => {
      if (event.kind === 'cancel' || metadataLoadWasCancelled(onChainLoadQueue, event.id)) return EMPTY;

      return timer(ON_CHAIN_COLLECTIBLES_BATCH_DELAY_MS).pipe(
        mergeMap(() => from(loadOnChainCollectibleBatch(event.action.payload.items))),
        mergeMap(actions => from(actions)),
        takeUntil(action$.pipe(filter(isCollectiblesListingChange))),
        catchError(emptyAfterLoadError)
      );
    })
  );
