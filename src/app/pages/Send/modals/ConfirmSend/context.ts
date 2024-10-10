import { useState } from 'react';

import constate from 'constate';

import { EvmEstimationData } from 'app/pages/Send/hooks/use-evm-estimation-data';

import { EvmFeeOptions } from './interfaces';

interface ExtendedEstimationData extends EvmEstimationData {
  feeOptions: EvmFeeOptions;
}

export const [EvmEstimationDataProvider, useEvmEstimationDataState] = constate(() => {
  const [data, setData] = useState<ExtendedEstimationData | nullish>(null);

  return { data, setData };
});
