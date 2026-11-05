import { partition } from 'lodash';
import { Action } from 'redux';
import { Epic, StateObservable } from 'redux-observable';
import { asapScheduler, concat, defer, EMPTY, from, merge, Observable, of, race, Subject, timer } from 'rxjs';
import {
  auditTime,
  buffer,
  catchError,
  connect,
  exhaustMap,
  filter,
  finalize,
  ignoreElements,
  map,
  mergeMap,
  observeOn,
  repeat,
  share,
  startWith,
  switchMap,
  take,
  takeUntil,
  tap,
  timeout
} from 'rxjs/operators';
import { ofType } from 'ts-action-operators';

import { setEvmCollectiblesMetadataLoading } from 'app/store/evm/actions';
import { RootState } from 'app/store/root-state.type';
import { getEvmCollectiblesMetadata } from 'lib/apis/temple/endpoints/evm';
import { ChainID } from 'lib/apis/temple/endpoints/evm/api.interfaces';
import { isSupportedChainId } from 'lib/apis/temple/endpoints/evm/api.utils';
import { fetchEvmCollectibleMetadataFromChainInBulk } from 'lib/evm/on-chain/metadata';
import { EvmCollectibleMetadata } from 'lib/metadata/types';
import { EMPTY_FROZEN_ARRAY } from 'lib/utils';
import { groupByToEntries } from 'lib/utils/group-by-to-entries';
import { IpfsTransientError } from 'lib/utils/ipfs';
import { EvmNetworkEssentials } from 'temple/networks';

import {
  cancelEvmCollectiblesMetadataLoadingAction,
  loadEvmCollectiblesMetadataAction,
  markEvmCollectibleSlugsCheckedAction,
  markEvmCollectiblesMetadataChainLoadedAction,
  processLoadedEvmCollectiblesMetadataAction,
  putEvmCollectiblesMetadataAction
} from './actions';

const API_DUMP_RETRY_MS = 60_000;
const API_DUMP_TIMEOUT_MS = 30_000;
const BACKGROUND_BATCH_SIZE = 8;
const BACKGROUND_BATCH_DELAY_MS = 2_000;
const READ_EMISSION_WINDOW_MS = 100;
const BACKGROUND_READ_LIMIT_MS = 60_000;

type LoadPayload = ReturnType<typeof loadEvmCollectiblesMetadataAction>['payload'];

interface Session {
  publicKeyHash: HexString;
  state$: StateObservable<RootState>;
  apiDumps: ApiDumps;
  requests$: Observable<LoadPayload>;
  dumpSettled: Subject<ChainID>;
  chains: Map<number, EvmNetworkEssentials>;
  priorityChainIds: readonly number[];
  visibleSlugs: Map<number, readonly string[]>;
  claimed: Set<string>;
  droppedInBackground: Set<string>;
  initialDumps: Set<number>;
  backgroundDone: boolean;
}

type ReadKind = 'foreground' | 'background';

interface SettledRead {
  chainId: number;
  slug: string;
  metadata?: EvmCollectibleMetadata;
  transientUntil?: number;
  dropped?: true;
}

type TransientRead = SettledRead & { transientUntil: number };

type BackgroundPick =
  | { kind: 'read'; chainId: number; slugs: string[] }
  | { kind: 'sleep'; until: number }
  | { kind: 'wait' }
  | { kind: 'done' };

interface ChainBackgroundWork {
  chainId: number;
  dueRetries: string[];
  fresh: string[];
  dropped: string[];
}

interface ApiDumpSettlement {
  publicKeyHash: HexString;
  chainId: ChainID;
}

const getApiDumpKey = (publicKeyHash: HexString, chainId: number) => `${publicKeyHash}:${chainId}`;

const getSlugKey = (chainId: number, slug: string) => `${chainId}:${slug}`;

const getSessionKey = ({ publicKeyHash, chains, readAllInBackground }: LoadPayload, testnetMode: boolean) => {
  const chainIds = chains.map(({ chainId }) => chainId).sort((a, b) => a - b);

  return `${publicKeyHash}:${testnetMode}:${chainIds.join(',')}:${readAllInBackground}`;
};

class ApiDumps {
  private readonly pending = new Set<string>();
  private readonly retryAt = new Map<string, number>();
  private readonly actions = new Subject<Action>();
  private readonly settlements = new Subject<ApiDumpSettlement>();
  readonly actions$ = this.actions.asObservable();
  readonly settled$ = this.settlements.asObservable();

  request(publicKeyHash: HexString, chainId: ChainID): void {
    const key = getApiDumpKey(publicKeyHash, chainId);

    if (this.pending.has(key)) return;

    this.pending.add(key);
    const controller = new AbortController();
    from(getEvmCollectiblesMetadata(publicKeyHash, chainId, controller.signal))
      .pipe(timeout(API_DUMP_TIMEOUT_MS))
      .subscribe({
        next: data => {
          this.actions.next(processLoadedEvmCollectiblesMetadataAction({ chainId, data }));
          this.actions.next(markEvmCollectiblesMetadataChainLoadedAction({ publicKeyHash, chainId }));
        },
        error: error => {
          controller.abort();
          console.error(error);
          this.retryAt.set(key, Date.now() + API_DUMP_RETRY_MS);
          this.settle(key, publicKeyHash, chainId);
        },
        complete: () => this.settle(key, publicKeyHash, chainId)
      });
  }

  isPending(publicKeyHash: HexString, chainId: number): boolean {
    return this.pending.has(getApiDumpKey(publicKeyHash, chainId));
  }

  getRetryAt(publicKeyHash: HexString, chainId: number): number {
    return this.retryAt.get(getApiDumpKey(publicKeyHash, chainId)) ?? 0;
  }

  private settle(key: string, publicKeyHash: HexString, chainId: ChainID): void {
    this.pending.delete(key);
    this.settlements.next({ publicKeyHash, chainId });
  }
}

const isApiDumpOwed = (state: RootState, publicKeyHash: HexString, chainId: number) =>
  isSupportedChainId(chainId) &&
  !state.settings.isTestnetModeEnabled &&
  !state.evmCollectiblesMetadata.seenChainsByAccount[publicKeyHash]?.includes(chainId);

const shouldRequestApiDump = ({ state$, publicKeyHash, apiDumps }: Session, chainId: number) =>
  isApiDumpOwed(state$.value, publicKeyHash, chainId) && Date.now() >= apiDumps.getRetryAt(publicKeyHash, chainId);

const getSlugsToRead = (
  state: RootState,
  publicKeyHash: HexString,
  chainId: number,
  candidates: readonly string[],
  now = Date.now()
): string[] => {
  const owned = state.evmAssets.collectibles[publicKeyHash]?.[chainId];
  const metadata = state.evmCollectiblesMetadata.metadataRecord[chainId];
  const checked = state.evmCollectiblesMetadata.checkedSlugsByAccount[publicKeyHash]?.[chainId];

  return candidates.filter(slug => {
    const check = checked?.[slug];

    return (
      Boolean(owned?.[slug]) && !metadata?.[slug]?.image && (check === undefined || (check !== true && check <= now))
    );
  });
};

const isTransientRead = (read: SettledRead): read is TransientRead => read.transientUntil !== undefined;

const toReadActions = (publicKeyHash: HexString, chainId: number, settled: SettledRead[]): Action[] => {
  const records = settled.reduce<StringRecord<EvmCollectibleMetadata>>(
    (acc, { slug, metadata }) => (metadata ? { ...acc, [slug]: metadata } : acc),
    {}
  );
  const transient = settled.filter(isTransientRead);
  const final = settled.filter(read => !isTransientRead(read));
  const actions: Action[] = [];

  if (Object.keys(records).length) actions.push(putEvmCollectiblesMetadataAction({ chainId, records }));

  if (final.length) {
    actions.push(
      markEvmCollectibleSlugsCheckedAction({ publicKeyHash, chainId, slugs: final.map(({ slug }) => slug) })
    );
  }

  if (transient.length) {
    actions.push(
      markEvmCollectibleSlugsCheckedAction({
        publicKeyHash,
        chainId,
        slugs: transient.map(({ slug }) => slug),
        retryAt: Math.max(...transient.map(({ transientUntil }) => transientUntil))
      })
    );
  }

  return actions;
};

const leavesView = ({ requests$ }: Session, chainId: number, slug: string) =>
  requests$.pipe(filter(({ visibleSlugsByChain }) => !visibleSlugsByChain[chainId]?.includes(slug)));

const readSlug = (
  session: Session,
  chain: EvmNetworkEssentials,
  slug: string,
  kind: ReadKind
): Observable<SettledRead> =>
  defer(() => {
    const { chainId } = chain;
    const controller = new AbortController();
    let settled = false;
    const read$ = from(fetchEvmCollectibleMetadataFromChainInBulk(chain, slug, controller.signal)).pipe(
      map((metadata): SettledRead => ({ chainId, slug, metadata })),
      catchError(error => {
        if (error instanceof IpfsTransientError) {
          return of<SettledRead>({ chainId, slug, transientUntil: error.retryAt });
        }

        console.error(error);

        return of<SettledRead>({ chainId, slug });
      }),
      tap(() => {
        settled = true;
      })
    );

    const bounded$ =
      kind === 'foreground'
        ? read$.pipe(takeUntil(leavesView(session, chainId, slug)))
        : race(read$, timer(BACKGROUND_READ_LIMIT_MS).pipe(map((): SettledRead => ({ chainId, slug, dropped: true }))));

    return bounded$.pipe(
      finalize(() => {
        if (settled) return;

        controller.abort();
        session.claimed.delete(getSlugKey(chainId, slug));
      })
    );
  });

const readSlugs = (
  session: Session,
  chainId: number,
  candidates: readonly string[],
  kind: ReadKind
): Observable<SettledRead> =>
  defer(() => {
    const { publicKeyHash, state$, chains, claimed, apiDumps } = session;
    const chain = chains.get(chainId);

    if (!chain || apiDumps.isPending(publicKeyHash, chainId)) return EMPTY;

    const slugs = getSlugsToRead(state$.value, publicKeyHash, chainId, candidates).filter(
      slug => !claimed.has(getSlugKey(chainId, slug))
    );

    if (!slugs.length) return EMPTY;

    for (const slug of slugs) claimed.add(getSlugKey(chainId, slug));

    return from(slugs).pipe(mergeMap(slug => readSlug(session, chain, slug, kind)));
  });

const readVisibleSlugs = (session: Session, chainId: number) =>
  readSlugs(session, chainId, session.visibleSlugs.get(chainId) ?? EMPTY_FROZEN_ARRAY, 'foreground');

const coalesceReads = (reads$: Observable<SettledRead>): Observable<SettledRead[]> =>
  reads$.pipe(connect(shared$ => shared$.pipe(buffer(shared$.pipe(auditTime(READ_EMISSION_WINDOW_MS))))));

const flushReads = (session: Session, settled: SettledRead[]): Observable<Action> => {
  const { publicKeyHash, claimed, droppedInBackground } = session;
  const finished = settled.filter(({ chainId, slug, dropped }) => {
    const key = getSlugKey(chainId, slug);
    claimed.delete(key);

    if (!dropped || droppedInBackground.has(key)) return true;

    droppedInBackground.add(key);

    return false;
  });

  return from(
    groupByToEntries(finished, ({ chainId }) => chainId).flatMap(([chainId, chainReads]) =>
      toReadActions(publicKeyHash, chainId, chainReads)
    )
  );
};

const readRequestedSlugs = (session: Session, requests$: Observable<LoadPayload>): Observable<SettledRead> =>
  requests$.pipe(
    mergeMap(({ chains, visibleSlugsByChain, priorityChainIds }) => {
      session.priorityChainIds = priorityChainIds;

      for (const chain of chains) session.chains.set(chain.chainId, chain);

      const chainIds = Array.from(session.chains.keys());

      for (const chainId of chainIds) {
        session.visibleSlugs.set(chainId, visibleSlugsByChain[chainId] ?? EMPTY_FROZEN_ARRAY);
      }

      return merge(...chainIds.map(chainId => readVisibleSlugs(session, chainId)));
    })
  );

const relayDumpSettlements = (session: Session): Observable<Action> =>
  session.apiDumps.settled$.pipe(
    filter(({ publicKeyHash, chainId }) => publicKeyHash === session.publicKeyHash && session.chains.has(chainId)),
    mergeMap(({ chainId }) => {
      const settledInitialDump = session.initialDumps.delete(chainId);
      session.dumpSettled.next(chainId);

      return settledInitialDump && session.initialDumps.size === 0
        ? of(setEvmCollectiblesMetadataLoading(false))
        : EMPTY;
    })
  );

const retryApiDumpWhenDue = (session: Session, chainId: ChainID): Observable<never> =>
  defer(() => {
    const { publicKeyHash, state$, apiDumps } = session;

    if (apiDumps.isPending(publicKeyHash, chainId) || !isApiDumpOwed(state$.value, publicKeyHash, chainId)) {
      return EMPTY;
    }

    const delay = apiDumps.getRetryAt(publicKeyHash, chainId) - Date.now();

    if (delay > 0) return timer(delay).pipe(mergeMap(() => retryApiDumpWhenDue(session, chainId)));

    apiDumps.request(publicKeyHash, chainId);

    return EMPTY;
  });

const retryApiDumps = (session: Session, chainIds: ChainID[]): Observable<Action> =>
  merge(from(chainIds), session.dumpSettled).pipe(mergeMap(chainId => retryApiDumpWhenDue(session, chainId)));

const pickReadBatch = (work: ChainBackgroundWork[]): BackgroundPick | undefined => {
  for (const kind of ['dueRetries', 'fresh', 'dropped'] as const) {
    const chainWork = work.find(item => item[kind].length > 0);

    if (chainWork)
      return { kind: 'read', chainId: chainWork.chainId, slugs: chainWork[kind].slice(0, BACKGROUND_BATCH_SIZE) };
  }

  return undefined;
};

const pickBackgroundBatch = (session: Session): BackgroundPick => {
  const { publicKeyHash, state$, chains, priorityChainIds, claimed, droppedInBackground, apiDumps } = session;
  const state = state$.value;
  const now = Date.now();
  const work: ChainBackgroundWork[] = [];
  let waiting = false;
  let nextRetryAt = Infinity;

  for (const chainId of chains.keys()) {
    const owned = Object.keys(state.evmAssets.collectibles[publicKeyHash]?.[chainId] ?? {});
    const checked = state.evmCollectiblesMetadata.checkedSlugsByAccount[publicKeyHash]?.[chainId];
    const metadata = state.evmCollectiblesMetadata.metadataRecord[chainId];
    const readable = getSlugsToRead(state, publicKeyHash, chainId, owned, now);

    for (const slug of owned) {
      const retryAt = checked?.[slug];

      if (typeof retryAt === 'number' && retryAt > now && !metadata?.[slug]?.image) {
        nextRetryAt = Math.min(nextRetryAt, retryAt);
      }
    }

    if (apiDumps.isPending(publicKeyHash, chainId)) {
      waiting ||= readable.length > 0;
      continue;
    }

    const idle = readable.filter(slug => !claimed.has(getSlugKey(chainId, slug)));
    const [dropped, fresh] = partition(idle, slug => droppedInBackground.has(getSlugKey(chainId, slug)));
    const dueRetries = fresh.filter(slug => typeof checked?.[slug] === 'number');

    work.push({ chainId, dueRetries, fresh, dropped });

    waiting ||= idle.length < readable.length;
  }

  const [priorityWork, otherWork] = partition(work, ({ chainId }) => priorityChainIds.includes(chainId));
  const readPick = pickReadBatch(priorityWork) ?? pickReadBatch(otherWork);

  if (readPick) return readPick;

  if (waiting) return { kind: 'wait' };

  return nextRetryAt < Infinity ? { kind: 'sleep', until: nextRetryAt } : { kind: 'done' };
};

const waitForInitialApiDumps = (session: Session): Observable<never> =>
  defer(() =>
    session.initialDumps.size
      ? session.dumpSettled.pipe(
          filter(() => session.initialDumps.size === 0),
          take(1)
        )
      : EMPTY
  ).pipe(ignoreElements());

const runBackgroundPass = (session: Session): Observable<SettledRead> => {
  const readNextBatch = (): Observable<SettledRead> => {
    const pick = pickBackgroundBatch(session);

    switch (pick.kind) {
      case 'read':
        return readSlugs(session, pick.chainId, pick.slugs, 'background');
      case 'sleep':
        return timer(Math.max(0, pick.until - Date.now())).pipe(ignoreElements());
      case 'wait':
        return EMPTY;
      case 'done':
        session.backgroundDone = true;

        return EMPTY;
    }
  };

  return concat(
    timer(BACKGROUND_BATCH_DELAY_MS).pipe(ignoreElements()),
    defer(readNextBatch).pipe(
      repeat({ delay: () => (session.backgroundDone ? EMPTY : timer(BACKGROUND_BATCH_DELAY_MS)) })
    )
  );
};

const readInBackground = (session: Session): Observable<SettledRead> =>
  concat(
    waitForInitialApiDumps(session),
    session.requests$.pipe(
      // Picks after the reads this request aborts have released their slugs.
      observeOn(asapScheduler),
      filter(() => session.backgroundDone && ['read', 'sleep'].includes(pickBackgroundBatch(session).kind)),
      startWith(undefined),
      exhaustMap(() => {
        session.backgroundDone = false;

        return runBackgroundPass(session);
      })
    )
  );

const startLoadingSession = (
  initial: LoadPayload,
  state$: StateObservable<RootState>,
  apiDumps: ApiDumps,
  requests$: Observable<LoadPayload>
): Observable<Action> =>
  defer(() => {
    const { publicKeyHash, chains, readAllInBackground } = initial;
    const session: Session = {
      publicKeyHash,
      state$,
      apiDumps,
      requests$,
      dumpSettled: new Subject<ChainID>(),
      chains: new Map(chains.map(chain => [chain.chainId, chain])),
      priorityChainIds: initial.priorityChainIds,
      visibleSlugs: new Map(),
      claimed: new Set(),
      droppedInBackground: new Set(),
      initialDumps: new Set(),
      backgroundDone: false
    };
    const supportedChainIds = chains.map(({ chainId }) => chainId).filter(isSupportedChainId);

    for (const chainId of supportedChainIds) {
      if (shouldRequestApiDump(session, chainId)) apiDumps.request(publicKeyHash, chainId);

      if (apiDumps.isPending(publicKeyHash, chainId)) session.initialDumps.add(chainId);
    }

    const reads$ = merge(
      readRequestedSlugs(session, requests$.pipe(startWith(initial))),
      session.dumpSettled.pipe(mergeMap(chainId => readVisibleSlugs(session, chainId))),
      readAllInBackground ? readInBackground(session) : EMPTY
    );

    return concat(
      of(setEvmCollectiblesMetadataLoading(session.initialDumps.size > 0)),
      merge(
        relayDumpSettlements(session),
        coalesceReads(reads$).pipe(mergeMap(settled => flushReads(session, settled))),
        retryApiDumps(session, supportedChainIds)
      )
    ).pipe(
      catchError(error => {
        console.error(error);

        return of(setEvmCollectiblesMetadataLoading(false));
      })
    );
  });

export const evmCollectiblesMetadataEpics: Epic<Action, Action, RootState> = (action$, state$) => {
  const apiDumps = new ApiDumps();
  const loads$ = action$.pipe(
    ofType(loadEvmCollectiblesMetadataAction),
    map(({ payload }) => payload),
    share()
  );
  let runningSessionKey: string | undefined;

  const getKey = (payload: LoadPayload) => getSessionKey(payload, state$.value.settings.isTestnetModeEnabled);
  const feedsSession = (payload: LoadPayload, sessionKey: string | undefined) => getKey(payload) === sessionKey;

  const sessions$ = action$.pipe(
    ofType(loadEvmCollectiblesMetadataAction, cancelEvmCollectiblesMetadataLoadingAction),
    filter(
      action => !loadEvmCollectiblesMetadataAction.match(action) || !feedsSession(action.payload, runningSessionKey)
    ),
    switchMap(action => {
      if (!loadEvmCollectiblesMetadataAction.match(action)) return of(setEvmCollectiblesMetadataLoading(false));

      const sessionKey = getKey(action.payload);
      const requests$ = loads$.pipe(filter(payload => feedsSession(payload, sessionKey)));

      return defer(() => {
        runningSessionKey = sessionKey;

        return startLoadingSession(action.payload, state$, apiDumps, requests$);
      }).pipe(
        finalize(() => {
          runningSessionKey = undefined;
        })
      );
    })
  );

  return merge(apiDumps.actions$, sessions$);
};
