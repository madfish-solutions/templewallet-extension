import { useMemo } from 'react';

import { useSwapTokensSelector } from 'app/store/swap/selectors';
import { toTokenSlug } from 'lib/assets';

export const useAvailableRoute3TokensSlugs = () => {
  const { data: route3tokens, isLoading } = useSwapTokensSelector();

  const route3tokensSlugs = useMemo(
    () =>
      route3tokens.reduce<string[]>((acc, { contract, tokenId }) => {
        if (contract === null) return acc; // Gas token case

        return acc.concat(toTokenSlug(contract, tokenId ?? 0));
      }, []),
    [route3tokens]
  );

  return {
    isLoading,
    route3tokensSlugs
  };
};
