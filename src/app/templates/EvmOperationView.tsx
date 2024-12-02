import React, { FC } from 'react';

import ReactJson from 'react-json-view';

import { CopyButton } from 'app/atoms';
import { TempleEvmDAppSignPayload } from 'lib/temple/types';
import { EvmNetworkEssentials } from 'temple/networks';

interface EvmOperationViewProps {
  network: EvmNetworkEssentials;
  payload: TempleEvmDAppSignPayload;
  networkRpc?: string;
  error?: any;
}

export const EvmOperationView: FC<EvmOperationViewProps> = ({ payload }) => {
  if (payload.type === 'sign_typed') {
    return (
      <div className="flex flex-col w-full">
        <h2 className="mb-3 leading-tight flex items-center">
          <span className="mr-2 text-base font-semibold text-gray-700">Sign typed data</span>
        </h2>
        <CopyButton text={JSON.stringify(payload.payload)}>Copy</CopyButton>
        <ReactJson
          src={payload.payload}
          name={null}
          iconStyle="square"
          indentWidth={4}
          collapsed={3}
          collapseStringsAfterLength={36}
          enableClipboard={false}
          displayObjectSize={false}
          displayDataTypes={false}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      <h2 className="mb-3 leading-tight flex items-center">
        <span className="mr-2 text-base font-semibold text-gray-700">Personal sign</span>
      </h2>
      <CopyButton text={payload.payload}>Copy</CopyButton>
      <ReactJson
        src={{ string: payload.payload }}
        name={null}
        iconStyle="square"
        indentWidth={4}
        collapsed={3}
        collapseStringsAfterLength={36}
        enableClipboard={false}
        displayObjectSize={false}
        displayDataTypes={false}
      />
    </div>
  );
};
