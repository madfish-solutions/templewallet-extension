import React, { FC } from 'react';

import { TempleEvmDAppSignPayload } from 'lib/temple/types';
import { EvmNetworkEssentials } from 'temple/networks';

import { NewRawPayloadView } from './NewRawPayloadView';

interface EvmOperationViewProps {
  network: EvmNetworkEssentials;
  payload: TempleEvmDAppSignPayload;
  networkRpc?: string;
  error?: any;
}

export const EvmOperationView: FC<EvmOperationViewProps> = ({ payload }) => (
  <NewRawPayloadView payload={payload.payload} />
);
