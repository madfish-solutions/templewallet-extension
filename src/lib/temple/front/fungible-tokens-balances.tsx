import constate from 'constate';

import { fetchTokenBalances, fetchTokenBalancesCount } from 'lib/tzkt/client';

import { useInfiniteList } from './use-infinite-list';

export const [FungibleTokensBalancesProvider, useFungibleTokensBalances] = constate(() => {
  const { items, hasMore, isLoading, setItems, loadItems } = useInfiniteList({
    getCount: fetchTokenBalancesCount,
    getItems: fetchTokenBalances
  });

  return {
    items,
    hasMore,
    isLoading,
    setItems,
    loadItems
  };
});
