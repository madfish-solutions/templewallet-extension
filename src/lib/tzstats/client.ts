import axios, { AxiosError } from "axios";
import {
  TZStatsNetwork,
  ErrorData,
  QueryArguments,
  QueryFilter,
  OperationRowTuple,
  OperationRow
} from "lib/tzstats/types";

export type Query<T> = (
  n: TZStatsNetwork,
  a?: QueryArguments | null,
  f?: QueryFilter[]
) => Promise<T>;

const api = axios.create();
api.interceptors.response.use(
  res => res,
  err => {
    if (process.env.NODE_ENV === "development") {
      console.error(err);
    }

    const errors: ErrorData[] = (err as AxiosError).response?.data?.errors;
    const finalError = new Error("Failed when querying TZStats API");
    (finalError as any).errors = errors ?? [];
    throw finalError;
  }
);

export const getOperationTable = wrap(
  query<OperationRowTuple[]>("/tables/op"),
  ops =>
    ops.map(
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
        delegate
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
        delegate
      })
    )
);

function query<T = any>(path: string): Query<T> {
  return async (network, args, filters = []) => {
    const params: { [key: string]: any } = { ...(args ?? {}) };
    for (const [column, operator, argument] of filters) {
      params[`${column}.${operator}`] = argument;
    }

    const res = await api.get<T>(path, {
      baseURL: network,
      params
    });
    return res.data;
  };
}

function wrap<T, U>(query: Query<T>, transformer: (d: T) => U): Query<U> {
  return (...args) => query(...args).then(transformer);
}
