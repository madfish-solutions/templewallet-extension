import { Action } from 'redux';
import { Epic, StateObservable } from 'redux-observable';
import { asapScheduler, concat, defer, EMPTY, from, merge, Observable, of, Subject, timer, TimeoutError } from 'rxjs';
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
import { ChainID, NftAddressBalanceNftResponse } from 'lib/apis/temple/endpoints/evm/api.interfaces';
import { isSupportedChainId } from 'lib/apis/temple/endpoints/evm/api.utils';
import { fetchEvmCollectibleMetadataFromChainInBulk } from 'lib/evm/on-chain/metadata';
import { EvmCollectibleMetadata } from 'lib/metadata/types';
import { EMPTY_FROZEN_ARRAY } from 'lib/utils';
import { groupByToEntries } from 'lib/utils/group-by-to-entries';
import { IpfsHostPausedError, IpfsTransientError } from 'lib/utils/ipfs';
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
const API_DUMP_RETENTION_MS = 60_000;
const API_DUMP_TIMEOUT_MS = 30_000;
const BACKGROUND_BATCH_SIZE = 8;
const BACKGROUND_BATCH_DELAY_MS = 2_000;
const READ_EMISSION_WINDOW_MS = 100;

type LoadPayload = ReturnType<typeof loadEvmCollectiblesMetadataAction>['payload'];

interface PausesEnd {
  chainId: number;
  slugs: string[];
}

interface RetryLater {
  chainId: number;
  slug: string;
  retryAt: number;
}

interface Session {
  publicKeyHash: HexString;
  state$: StateObservable<RootState>;
  apiDumps: ApiDumps;
  requests$: Observable<LoadPayload>;
  dumpSettled: Subject<ChainID>;
  pausesEnded: Subject<PausesEnd>;
  chains: Map<number, EvmNetworkEssentials>;
  visibleSlugs: Map<number, readonly string[]>;
  inFlight: Set<string>;
  pendingDumps: Set<number>;
  initialDumps: Set<number>;
  backgroundAttempted: Set<string>;
  backgroundDone: boolean;
  retryLater: Map<string, RetryLater>;
  retried: Set<string>;
}

type ReadKind = 'foreground' | 'background';

interface SettledRead {
  chainId: number;
  slug: string;
  metadata?: EvmCollectibleMetadata;
  retryAt?: number;
  transientUntil?: number;
}

type PausedRead = SettledRead & { retryAt: number };

type BatchPick = { chainId: number; slugs: string[]; retry?: true } | { retryAt: number };

type BackgroundPick = BatchPick | 'wait' | 'done';

interface ApiDumpRequest {
  dump: Promise<NftAddressBalanceNftResponse>;
  requestedAt: number;
}

const getApiDumpKey = (publicKeyHash: HexString, chainId: number) => `${publicKeyHash}:${chainId}`;

const getSlugKey = (chainId: number, slug: string) => `${chainId}:${slug}`;

const getSessionKey = ({ publicKeyHash, chains, readAllInBackground }: LoadPayload, testnetMode: boolean) => {
  const chainIds = chains.map(({ chainId }) => chainId).sort((a, b) => a - b);

  return `${publicKeyHash}:${testnetMode}:${chainIds.join(',')}:${readAllInBackground}`;
};

class ApiDumps {
  private readonly requests = new Map<string, ApiDumpRequest>();
  private readonly retentionTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly retryAt = new Map<string, number>();

  request(publicKeyHash: HexString, chainId: ChainID): ApiDumpRequest {
    const key = getApiDumpKey(publicKeyHash, chainId);
    const requested = this.requests.get(key);

    if (requested) return requested;

    const request: ApiDumpRequest = {
      dump: getEvmCollectiblesMetadata(publicKeyHash, chainId),
      requestedAt: Date.now()
    };
    this.requests.set(key, request);
    void request.dump.then(
      () => {
        if (this.requests.get(key) !== request) return;

        this.retentionTimers.set(
          key,
          setTimeout(() => this.forget(key), API_DUMP_RETENTION_MS)
        );
      },
      () => {
        if (this.requests.get(key) === request) this.recordFailure(key);
      }
    );

    return request;
  }

  consume(publicKeyHash: HexString, chainId: number) {
    this.forget(getApiDumpKey(publicKeyHash, chainId));
  }

  fail(publicKeyHash: HexString, chainId: number) {
    this.recordFailure(getApiDumpKey(publicKeyHash, chainId));
  }

  getRetryAt(publicKeyHash: HexString, chainId: number) {
    return this.retryAt.get(getApiDumpKey(publicKeyHash, chainId)) ?? 0;
  }

  private forget(key: string) {
    clearTimeout(this.retentionTimers.get(key));
    this.retentionTimers.delete(key);
    this.requests.delete(key);
  }

  private recordFailure(key: string) {
    this.forget(key);
    this.retryAt.set(key, Date.now() + API_DUMP_RETRY_MS);
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
  ignoreChecked = false
): string[] => {
  const owned = state.evmAssets.collectibles[publicKeyHash]?.[chainId];
  const metadata = state.evmCollectiblesMetadata.metadataRecord[chainId];
  const checked = state.evmCollectiblesMetadata.checkedSlugsByAccount[publicKeyHash]?.[chainId];

  return candidates.filter(slug => Boolean(owned?.[slug]) && !metadata?.[slug] && (ignoreChecked || !checked?.[slug]));
};

const isPausedRead = (read: SettledRead): read is PausedRead => read.retryAt !== undefined;

const toReadActions = (publicKeyHash: HexString, chainId: number, settled: SettledRead[]): Action[] => {
  const records = settled.reduce<StringRecord<EvmCollectibleMetadata>>(
    (acc, { slug, metadata }) => (metadata ? { ...acc, [slug]: metadata } : acc),
    {}
  );
  const checkedSlugs = settled.filter(read => !isPausedRead(read)).map(({ slug }) => slug);
  const actions: Action[] = [];

  if (Object.keys(records).length) actions.push(putEvmCollectiblesMetadataAction({ chainId, records }));

  if (checkedSlugs.length) {
    actions.push(markEvmCollectibleSlugsCheckedAction({ publicKeyHash, chainId, slugs: checkedSlugs }));
  }

  return actions;
};

const leavesView = ({ requests$ }: Session, chainId: number, slug: string) =>
  requests$.pipe(filter(({ onChainSlugsByChain }) => !onChainSlugsByChain[chainId]?.includes(slug)));

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
        if (error instanceof IpfsHostPausedError) return of<SettledRead>({ chainId, slug, retryAt: error.retryAt });

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

    return (kind === 'foreground' ? read$.pipe(takeUntil(leavesView(session, chainId, slug))) : read$).pipe(
      finalize(() => {
        if (settled) return;

        controller.abort();
        session.inFlight.delete(getSlugKey(chainId, slug));
      })
    );
  });

const readSlugs = (
  session: Session,
  chainId: number,
  candidates: readonly string[],
  kind: ReadKind,
  ignoreChecked = false
): Observable<SettledRead> =>
  defer(() => {
    const { publicKeyHash, state$, chains, inFlight, pendingDumps } = session;
    const chain = chains.get(chainId);

    if (!chain || pendingDumps.has(chainId)) return EMPTY;

    const slugs = getSlugsToRead(state$.value, publicKeyHash, chainId, candidates, ignoreChecked).filter(
      slug => !inFlight.has(getSlugKey(chainId, slug))
    );

    if (!slugs.length) return EMPTY;

    for (const slug of slugs) inFlight.add(getSlugKey(chainId, slug));

    return from(slugs).pipe(mergeMap(slug => readSlug(session, chain, slug, kind)));
  });

const readVisibleSlugs = (session: Session, chainId: number) =>
  readSlugs(session, chainId, session.visibleSlugs.get(chainId) ?? EMPTY_FROZEN_ARRAY, 'foreground');

const releaseAfterPauses = (session: Session, chainId: number, paused: PausedRead[]): Observable<never> =>
  merge(
    ...groupByToEntries(paused, ({ retryAt }) => retryAt).map(([retryAt, reads]) =>
      timer(Math.max(0, retryAt - Date.now())).pipe(
        tap(() => session.pausesEnded.next({ chainId, slugs: reads.map(({ slug }) => slug) })),
        ignoreElements()
      )
    )
  );

const readAfterPauses = (session: Session): Observable<SettledRead> =>
  session.pausesEnded.pipe(
    mergeMap(({ chainId, slugs }) => {
      const visible = new Set(session.visibleSlugs.get(chainId));

      for (const slug of slugs) {
        session.inFlight.delete(getSlugKey(chainId, slug));
        session.backgroundAttempted.delete(getSlugKey(chainId, slug));
      }

      return readSlugs(
        session,
        chainId,
        slugs.filter(slug => visible.has(slug)),
        'foreground'
      );
    })
  );

const coalesceReads = (reads$: Observable<SettledRead>): Observable<SettledRead[]> =>
  reads$.pipe(connect(shared$ => shared$.pipe(buffer(shared$.pipe(auditTime(READ_EMISSION_WINDOW_MS))))));

const flushReads = (session: Session, settled: SettledRead[]): Observable<Action> => {
  const { publicKeyHash, inFlight } = session;

  for (const read of settled) {
    if (isPausedRead(read)) continue;

    const key = getSlugKey(read.chainId, read.slug);
    inFlight.delete(key);

    if (read.transientUntil !== undefined && !session.retried.has(key)) {
      session.retryLater.set(key, { chainId: read.chainId, slug: read.slug, retryAt: read.transientUntil });
    }
  }

  return merge(
    ...groupByToEntries(settled, ({ chainId }) => chainId).map(([chainId, chainReads]) =>
      concat(
        from(toReadActions(publicKeyHash, chainId, chainReads)),
        releaseAfterPauses(session, chainId, chainReads.filter(isPausedRead))
      )
    )
  );
};

const readRequestedSlugs = (session: Session, requests$: Observable<LoadPayload>): Observable<SettledRead> =>
  requests$.pipe(
    mergeMap(({ chains, onChainSlugsByChain }) => {
      for (const chain of chains) session.chains.set(chain.chainId, chain);

      const chainIds = Array.from(session.chains.keys());

      for (const chainId of chainIds) {
        session.visibleSlugs.set(chainId, onChainSlugsByChain[chainId] ?? EMPTY_FROZEN_ARRAY);
      }

      return merge(...chainIds.map(chainId => readVisibleSlugs(session, chainId)));
    })
  );

const loadApiDump = ({ apiDumps, publicKeyHash }: Session, chainId: ChainID): Observable<Action> =>
  defer(() => {
    const { dump, requestedAt } = apiDumps.request(publicKeyHash, chainId);

    return from(dump).pipe(timeout({ first: new Date(requestedAt + API_DUMP_TIMEOUT_MS) }));
  }).pipe(
    mergeMap(data => {
      apiDumps.consume(publicKeyHash, chainId);

      return of(
        processLoadedEvmCollectiblesMetadataAction({ chainId, data }),
        markEvmCollectiblesMetadataChainLoadedAction({ publicKeyHash, chainId })
      );
    }),
    catchError(error => {
      if (error instanceof TimeoutError) apiDumps.fail(publicKeyHash, chainId);

      console.error(error);

      return EMPTY;
    })
  );

const runApiDump = (session: Session, chainId: ChainID): Observable<Action> =>
  concat(
    loadApiDump(session, chainId),
    defer(() => {
      const settledInitialDump = session.initialDumps.delete(chainId);
      session.pendingDumps.delete(chainId);
      session.dumpSettled.next(chainId);

      return settledInitialDump && session.initialDumps.size === 0
        ? of(setEvmCollectiblesMetadataLoading(false))
        : EMPTY;
    })
  );

const startApiDump = (session: Session, chainId: ChainID): Observable<Action> =>
  defer(() => {
    session.pendingDumps.add(chainId);

    return runApiDump(session, chainId);
  });

const requestDueApiDump = (session: Session, chainId: ChainID): Observable<Action> =>
  defer(() =>
    session.pendingDumps.has(chainId) || !shouldRequestApiDump(session, chainId)
      ? EMPTY
      : startApiDump(session, chainId)
  );

const requestDueApiDumps = (session: Session): Observable<Action> =>
  session.requests$.pipe(
    mergeMap(() =>
      merge(
        ...Array.from(session.chains.keys())
          .filter(isSupportedChainId)
          .map(chainId => requestDueApiDump(session, chainId))
      )
    )
  );

const retryApiDumpWhenDue = (session: Session, chainId: ChainID): Observable<Action> =>
  defer(() => {
    const { publicKeyHash, state$, pendingDumps, apiDumps } = session;

    if (pendingDumps.has(chainId) || !isApiDumpOwed(state$.value, publicKeyHash, chainId)) return EMPTY;

    const delay = apiDumps.getRetryAt(publicKeyHash, chainId) - Date.now();

    return delay > 0
      ? timer(delay).pipe(mergeMap(() => retryApiDumpWhenDue(session, chainId)))
      : startApiDump(session, chainId);
  });

const retryApiDumps = (session: Session, chainIds: ChainID[]): Observable<Action> =>
  merge(from(chainIds), session.dumpSettled).pipe(mergeMap(chainId => retryApiDumpWhenDue(session, chainId)));

const pickRetryBatch = ({ retryLater, inFlight }: Session): BatchPick | undefined => {
  const pending = Array.from(retryLater.entries()).filter(([key]) => !inFlight.has(key));

  if (!pending.length) return undefined;

  const now = Date.now();
  const due = pending.filter(([, { retryAt }]) => retryAt <= now);

  if (!due.length) return { retryAt: Math.min(...pending.map(([, { retryAt }]) => retryAt)) };

  const { chainId } = due[0][1];

  return {
    chainId,
    slugs: due
      .filter(([, read]) => read.chainId === chainId)
      .slice(0, BACKGROUND_BATCH_SIZE)
      .map(([, { slug }]) => slug),
    retry: true
  };
};

const pickBackgroundBatch = (session: Session): BackgroundPick => {
  const { publicKeyHash, state$, chains, inFlight, pendingDumps, backgroundAttempted } = session;
  const retry = pickRetryBatch(session);

  if (retry && 'slugs' in retry) return retry;

  const state = state$.value;
  let waiting = false;

  for (const chainId of chains.keys()) {
    const owned = Object.keys(state.evmAssets.collectibles[publicKeyHash]?.[chainId] ?? {});
    const unread = getSlugsToRead(state, publicKeyHash, chainId, owned);

    if (pendingDumps.has(chainId)) {
      waiting ||= unread.length > 0;
      continue;
    }

    const slugs = unread
      .filter(slug => !backgroundAttempted.has(getSlugKey(chainId, slug)) && !inFlight.has(getSlugKey(chainId, slug)))
      .slice(0, BACKGROUND_BATCH_SIZE);

    if (slugs.length) return { chainId, slugs };

    waiting ||= unread.some(slug => inFlight.has(getSlugKey(chainId, slug)));
  }

  if (waiting) return 'wait';

  return retry ?? 'done';
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

const holdUntilPauseEnds = (read: SettledRead): Observable<SettledRead> =>
  isPausedRead(read)
    ? concat(of(read), timer(Math.max(0, read.retryAt - Date.now())).pipe(ignoreElements()))
    : of(read);

const runBackgroundPass = (session: Session): Observable<SettledRead> => {
  const readNextBatch = () => {
    const pick = pickBackgroundBatch(session);

    if (pick === 'done') session.backgroundDone = true;

    if (typeof pick === 'string') return EMPTY;

    if ('retryAt' in pick) return timer(Math.max(0, pick.retryAt - Date.now())).pipe(ignoreElements());

    const { chainId, slugs, retry = false } = pick;
    for (const slug of slugs) {
      const key = getSlugKey(chainId, slug);
      session.backgroundAttempted.add(key);

      if (retry) {
        session.retryLater.delete(key);
        session.retried.add(key);
      }
    }

    return readSlugs(session, chainId, slugs, 'background', retry).pipe(mergeMap(holdUntilPauseEnds));
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
      observeOn(asapScheduler),
      filter(() => session.backgroundDone && typeof pickBackgroundBatch(session) !== 'string'),
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
      pausesEnded: new Subject<PausesEnd>(),
      chains: new Map(chains.map(chain => [chain.chainId, chain])),
      visibleSlugs: new Map(),
      inFlight: new Set(),
      pendingDumps: new Set(),
      initialDumps: new Set(),
      backgroundAttempted: new Set(),
      backgroundDone: false,
      retryLater: new Map(),
      retried: new Set()
    };
    const supportedChainIds = chains.map(({ chainId }) => chainId).filter(isSupportedChainId);
    const dumpChainIds = supportedChainIds.filter(chainId => shouldRequestApiDump(session, chainId));

    for (const chainId of dumpChainIds) {
      session.pendingDumps.add(chainId);
      session.initialDumps.add(chainId);
    }

    const reads$ = merge(
      readRequestedSlugs(session, requests$.pipe(startWith(initial))),
      session.dumpSettled.pipe(mergeMap(chainId => readVisibleSlugs(session, chainId))),
      readAfterPauses(session),
      readAllInBackground ? readInBackground(session) : EMPTY
    );

    return concat(
      of(setEvmCollectiblesMetadataLoading(dumpChainIds.length > 0)),
      merge(
        requestDueApiDumps(session),
        coalesceReads(reads$).pipe(mergeMap(settled => flushReads(session, settled))),
        retryApiDumps(session, supportedChainIds),
        ...dumpChainIds.map(chainId => runApiDump(session, chainId))
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
  const feedsSession = (payload: LoadPayload, sessionKey: string | undefined) =>
    !payload.loadAllChains && getKey(payload) === sessionKey;

  return action$.pipe(
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
};
