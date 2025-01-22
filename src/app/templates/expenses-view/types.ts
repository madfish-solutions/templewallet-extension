import { ReactNode } from 'react';

import BigNumber from 'bignumber.js';

import { OneOfChains } from 'temple/front';

export interface ExpensesViewProps<C extends OneOfChains = OneOfChains> {
  assetsDeltas: StringRecord<BigNumber>;
  chain: C;
  title: ReactNode;
}
