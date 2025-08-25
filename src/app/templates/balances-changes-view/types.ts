import BigNumber from 'bignumber.js';

import { EvmChain, OneOfChains } from 'temple/front';
import { AssetsAmounts } from 'temple/types';

export interface BalancesChangesViewProps<C extends OneOfChains = OneOfChains> {
  balancesChanges: AssetsAmounts[];
  chain: C;
  title?: string;
  bridgeData?: {
    inputNetwork: EvmChain;
    outputNetwork: EvmChain;
    executionTime: string;
    destinationChainGasTokenAmount?: BigNumber;
  };
}
