import { ReactElement } from 'react';

import { Placement } from '@popperjs/core';

import type { FilterChain } from 'app/store/assets-filter-options/state';
import type { PopperAnchorProps } from 'lib/ui/Popper';
import type { OneOfChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

export interface NetworkPopperProps {
  placement?: Placement;
  chainKind?: TempleChainKind;
  showAllNetworksOption: boolean;
  selectedOption: FilterChain;
  onOptionSelect: SyncFn<FilterChain>;
  children: (props: PopperAnchorProps & { selectedOptionName: string }) => ReactElement;
}

export type Network = OneOfChains | string;
