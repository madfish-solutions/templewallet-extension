import React, { memo } from 'react';

import { Divider } from 'app/atoms';

import { EvmChainsSettings } from './EvmChains';
import { TezosChainsSettings } from './TezosChains';

const NetworksSettings = memo(() => {
  return (
    <>
      <TezosChainsSettings />

      <Divider className="my-8" />

      <EvmChainsSettings />
    </>
  );
});

export default NetworksSettings;
