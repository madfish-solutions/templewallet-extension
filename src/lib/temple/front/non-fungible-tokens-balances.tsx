import constate from 'constate';

import { fetchNFTBalances, fetchNFTBalancesCount } from 'lib/tzkt/client';

import { useInfiniteList } from './use-infinite-list';

export const [NonFungibleTokensBalancesProvider, useNonFungibleTokensBalances] = constate(() => {
  const { items, hasMore, isLoading, setItems, loadItems } = useInfiniteList({
    getCount: fetchNFTBalancesCount,
    getItems: fetchNFTBalances
  });

  return {
    items,
    hasMore,
    isLoading,
    setItems,
    loadItems
  };
});
