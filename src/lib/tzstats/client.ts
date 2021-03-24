import axios, { AxiosError } from "axios";

import { TempleChainId } from "lib/temple/types";
import {
  TZStatsNetwork,
  ErrorData,
  QueryArguments,
  QueryFilter,
  OperationRowTuple,
  OperationRow,
  TZStatsAccountOp,
  TZStatsMarketTicker,
  TZStatsContract,
} from "lib/tzstats/types";

export const TZSTATS_CHAINS = new Map([
  [TempleChainId.Mainnet, TZStatsNetwork.Mainnet],
  [TempleChainId.Edo2net, TZStatsNetwork.Edonet],
  [TempleChainId.Florencenet, TZStatsNetwork.Florencenet],
  [TempleChainId.Delphinet, TZStatsNetwork.Delphinet],
  [TempleChainId.Carthagenet, TZStatsNetwork.Carthagenet],
]);

export type Explore<P, T> = (n: TZStatsNetwork, p?: Partial<P>) => Promise<T>;

export type Query<T> = (
  n: TZStatsNetwork,
  a?: QueryArguments | null,
  f?: QueryFilter[]
) => Promise<T>;

const api = axios.create();
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const errors: ErrorData[] = (err as AxiosError).response?.data?.errors;
    const finalError = new Error("Failed when querying TZStats API");
    throw Object.assign(finalError, {
      data: errors ?? [],
      origin: err,
    });
  }
);

export const getMarketTickers = () =>
  getMarketTickersPure(TZStatsNetwork.Mainnet);

export const getMarketTickersPure = explore<TZStatsMarketTicker[]>(
  "/markets/tickers"
);

export const getAccountWithOperations = explore<
  TZStatsAccountOp,
  {
    pkh: string;
    limit: number;
    offset: number;
    block: string | number;
    since: string | number;
    order: "asc" | "desc";
  }
>(({ pkh, ...rest }) => [`/explorer/account/${pkh}/op`, rest]);

export const getOneUserManagedContracts = explore<
  TZStatsContract[],
  { account: string }
>(({ account }) => [`/explorer/account/${account}/managed`, {}]);

export const getOperationTable = wrapQuery(
  query<OperationRowTuple[]>("/tables/op"),
  (opsInTuples) =>
    opsInTuples.map(
      ([
        rowId,
        time,
        height,
        cycle,
        hash,
        counter,
        opN,
        opL,
        opP,
        opC,
        opI,
        type,
        status,
        isSuccess,
        isContract,
        gasLimit,
        gasUsed,
        gasPrice,
        storageLimit,
        storageSize,
        storagePaid,
        volume,
        fee,
        reward,
        deposit,
        burned,
        senderId,
        receiverId,
        managerId,
        delegateId,
        isInternal,
        hasData,
        data,
        parameters,
        storage,
        bigMapDiff,
        errors,
        daysDestroyed,
        branchId,
        branchHeight,
        branchDepth,
        isImplicit,
        entrypointId,
        sender,
        receiver,
        manager,
        delegate,
      ]): OperationRow => ({
        rowId,
        time,
        height,
        cycle,
        hash,
        counter,
        opN,
        opL,
        opP,
        opC,
        opI,
        type,
        status,
        isSuccess,
        isContract,
        gasLimit,
        gasUsed,
        gasPrice,
        storageLimit,
        storageSize,
        storagePaid,
        volume,
        fee,
        reward,
        deposit,
        burned,
        senderId,
        receiverId,
        managerId,
        delegateId,
        isInternal,
        hasData,
        data,
        parameters,
        storage,
        bigMapDiff,
        errors,
        daysDestroyed,
        branchId,
        branchHeight,
        branchDepth,
        isImplicit,
        entrypointId,
        sender,
        receiver,
        manager,
        delegate,
      })
    )
);

function explore<T = any, P = never>(
  pathOrFactory: string | ((p: Partial<P>) => [string, Partial<P>])
): Explore<P, T> {
  return async (network, args) => {
    let path, params;
    if (typeof pathOrFactory === "function") {
      [path, params] = pathOrFactory(args!);
    } else {
      path = pathOrFactory;
    }

    const res = await api.get<T>(path, {
      baseURL: network,
      params,
    });
    return res.data;
  };
}

function query<T = any>(path: string): Query<T> {
  return async (network, args, filters = []) => {
    const params: { [key: string]: any } = { ...(args ?? {}) };
    for (const [column, operator, argument] of filters) {
      params[`${column}.${operator}`] = argument;
    }

    const res = await api.get<T>(path, {
      baseURL: network,
      params,
    });
    return res.data;
  };
}

function wrapQuery<T, U>(query: Query<T>, transformer: (d: T) => U): Query<U> {
  return (...args) => query(...args).then(transformer);
}
