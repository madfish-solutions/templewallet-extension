import { createContext } from 'react';

import { noop } from 'lodash';

import { FilterChain } from 'app/store/assets-filter-options/state';
import { StoredAccount, TempleAccountType } from 'lib/temple/types';
import { TempleChainKind } from 'temple/types';

interface ContentBodyBaseContextValue {
  onCryptoCardClick: EmptyFn;
  account: StoredAccount;
  filterChain: FilterChain;
}

export const ContentBodyBaseContext = createContext<ContentBodyBaseContextValue>({
  onCryptoCardClick: noop,
  account: { type: TempleAccountType.WatchOnly, chain: TempleChainKind.Tezos, address: '', id: '', name: '' },
  filterChain: null
});
