import { useMemo } from 'react';

import { uniqBy } from 'lodash';

import { searchAndFilterItems } from 'lib/utils/search-items';
import { getViemChainsList } from 'temple/evm/utils';
import { useAllEvmChains } from 'temple/front';

export const useSuggestedChains = (isTestnetTab: boolean, searchValue: string) => {
  const existentEvmChains = useAllEvmChains();

  const allSuggestedChains = useMemo(
    () =>
      uniqBy(
        getViemChainsList().filter(({ id, testnet }) => !existentEvmChains[id] && isTestnetTab === (testnet ?? false)),
        ({ id }) => id
      ),
    [existentEvmChains, isTestnetTab]
  );

  return useMemo(
    () =>
      searchValue ? searchAndFilterItems(allSuggestedChains, searchValue.trim(), [{ name: 'name', weight: 1 }]) : [],
    [allSuggestedChains, searchValue]
  );
};
