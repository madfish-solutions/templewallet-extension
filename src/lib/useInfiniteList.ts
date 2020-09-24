import { SWRInfiniteConfigInterface, useSWRInfinite } from "swr";
import { fetcherFn } from "swr/esm/types";
import { useCallback, useMemo } from "react";

export interface InfiniteListParams<
  PageData,
  Result,
  Key extends string | any[] | null
> {
  additionalConfig?: SWRInfiniteConfigInterface<PageData, any>;
  getDataLength: (pageData: PageData) => number;
  getKey: (index: number, previousPageData: PageData | null) => Key;
  fetcher: fetcherFn<PageData>;
  transformFn: (pagesData: PageData[]) => Result;
  itemsPerPage: number;
}

export interface InfiniteListResponseInterface<Result> {
  result: Result;
  error: any;
  load: () => void;
  loading: boolean;
  isLoadingMore?: boolean;
  isReachingEnd?: boolean;
  loadMore: () => void;
  isRefreshing?: boolean;
  refresh: () => void;
  clear: () => void;
}

export default function useInfiniteList<
  PageData,
  Result,
  Key extends string | any[] | null
>(
  params: InfiniteListParams<PageData, Result, Key>
): InfiniteListResponseInterface<Result> {
  const {
    additionalConfig,
    getDataLength,
    getKey,
    fetcher,
    transformFn,
    itemsPerPage,
  } = params;

  const { isValidating, error, data, mutate, setSize, size } = useSWRInfinite<
    PageData
  >(getKey, fetcher, { shouldRetryOnError: false, ...additionalConfig });

  const isLoadingInitialData = !data && !error;
  const isLoadingMore =
    isLoadingInitialData ||
    (size > 0 && data && typeof data[size - 1] === "undefined");
  const isEmpty = data?.[0] && getDataLength(data[0]) === 0;
  const isReachingEnd =
    isEmpty ||
    (data &&
      data[data.length - 1] &&
      getDataLength(data[data.length - 1]) < itemsPerPage);
  const isRefreshing = isValidating && data && data.length === size;

  const load = useCallback(() => setSize(1), [setSize]);
  const loadMore = useCallback(() => setSize((prevSize) => prevSize + 1), [
    setSize,
  ]);
  const clear = useCallback(() => setSize(0), [setSize]);
  const refresh = useCallback(() => mutate(), [mutate]);

  const result = useMemo(() => transformFn(data || []), [data, transformFn]);

  return {
    result,
    error,
    load,
    loading: isValidating,
    isLoadingMore,
    isReachingEnd,
    loadMore,
    isRefreshing,
    refresh,
    clear,
  };
}
