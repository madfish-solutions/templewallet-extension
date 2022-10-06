import { useCallback, useEffect, useRef, useState } from 'react';

import { TzktAccountTokenBalance } from 'lib/tzkt';

import { useAccount, useChainId } from './ready';

interface InfiniteListProps {
  getCount: (chainId: string, address: string) => Promise<number>;
  getItems: (chainId: string, address: string, page?: number) => Promise<Array<TzktAccountTokenBalance>>;
}

export const useInfiniteList = ({ getCount, getItems }: InfiniteListProps) => {
  const chainId = useChainId(true)!;
  const account = useAccount();
  const address = account.publicKeyHash;
  const [items, setItems] = useState<Array<TzktAccountTokenBalance>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const pageToLoad = useRef(0);
  const initialPageLoaded = useRef(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (initialPageLoaded.current) {
      initialPageLoaded.current = false;
      setItems([]);
    }
  }, [address, chainId]);

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    const count = await getCount(chainId, address);
    const data = await getItems(chainId, address, pageToLoad.current);
    pageToLoad.current = pageToLoad.current + 1;
    setHasMore(items.length < count);
    setItems(prevItems => [...prevItems, ...data]);
    setIsLoading(false);
  }, [address, chainId, getCount, getItems, items.length]);

  useEffect(() => {
    if (initialPageLoaded.current) {
      return;
    }
    pageToLoad.current = 0;

    loadItems();
    initialPageLoaded.current = true;
  }, [loadItems]);

  return {
    items,
    hasMore,
    isLoading,
    setItems,
    loadItems
  };
};
