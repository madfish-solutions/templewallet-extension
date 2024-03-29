import React, { memo } from 'react';

import { EvmNetworksSettings } from './EvmNetworks';
import { TezosNetworksSettings } from './TezosNetworks';

const NetworksSettings = memo(() => {
  return (
    <>
      <TezosNetworksSettings />
      <EvmNetworksSettings />
    </>
  );
});

export default NetworksSettings;
