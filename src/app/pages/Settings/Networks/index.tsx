import React, { memo } from 'react';

import { Lines } from 'app/atoms';

import { EvmChainsSettings } from './EvmChains';
import { TezosChainsSettings } from './TezosChains';

const NetworksSettings = memo(() => {
  return (
    <>
      <TezosChainsSettings />

      <Lines className="my-8" />

      <EvmChainsSettings />
    </>
  );
});

export default NetworksSettings;
