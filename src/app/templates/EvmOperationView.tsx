import React, { FC } from 'react';

import { TempleEvmDAppSignPayload } from 'lib/temple/types';

import { NewRawPayloadView } from './NewRawPayloadView';

// TODO: add properties like in `TezosOperationViewProps` when adding other types of EVM dApp actions
interface EvmOperationViewProps {
  payload: TempleEvmDAppSignPayload;
}

export const EvmOperationView: FC<EvmOperationViewProps> = ({ payload }) => (
  <NewRawPayloadView payload={payload.payload} />
);
