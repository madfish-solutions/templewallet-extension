import { ReactElement } from 'react';

import { Placement } from '@popperjs/core';

import type { FilterChain } from 'app/store/assets-filter-options/state';
import { TID } from 'lib/i18n';
import type { PopperAnchorProps } from 'lib/ui/Popper';
import type { OneOfChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

export interface NetworkPopperProps {
  placement?: Placement;
  chainKind?: TempleChainKind;
  showAllNetworksOption: boolean;
  showFavoritesOption?: boolean;
  selectedOption: FilterChain | string;
  onOptionSelect: SyncFn<FilterChain | string>;
  children: (props: PopperAnchorProps & { selectedOptionName: string }) => ReactElement;
  supportedChainIds?: number[];
}

export type Network = OneOfChains | TID;
