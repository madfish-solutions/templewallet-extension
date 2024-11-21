import { useState } from 'react';

import constate from 'constate';

import { EvmEstimationData } from 'app/pages/Send/hooks/use-evm-estimation-data';
import { TezosEstimationData } from 'app/pages/Send/hooks/use-tezos-estimation-data';

import { EvmFeeOptions } from './types';

type ExtendedEvmEstimationData = EvmEstimationData & {
  feeOptions: EvmFeeOptions;
};

export const [EvmEstimationDataProvider, useEvmEstimationDataState] = constate(() => {
  const [data, setData] = useState<ExtendedEvmEstimationData | nullish>(null);

  return { data, setData };
});

export const [TezosEstimationDataProvider, useTezosEstimationDataState] = constate(() => {
  const [data, setData] = useState<TezosEstimationData | nullish>(null);

  return { data, setData };
});
