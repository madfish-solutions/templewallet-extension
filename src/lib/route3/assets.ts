import { useMemo } from 'react';

import { useSwapTokensSelector } from 'app/store/swap/selectors';
import { toTokenSlug } from 'lib/assets';

import { isRoute3GasToken } from './utils/assets.utils';

export const useAvailableRoute3TokensSlugs = () => {
  const { data: route3tokens, isLoading } = useSwapTokensSelector();

  const route3tokensSlugs = useMemo(
    () =>
      route3tokens.reduce<string[]>((acc, { contract, tokenId }) => {
        if (isRoute3GasToken(contract)) return acc;

        return acc.concat(toTokenSlug(contract, tokenId ?? 0));
      }, []),
    [route3tokens]
  );

  return {
    isLoading,
    route3tokensSlugs
  };
};
