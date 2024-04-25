import React, { memo } from 'react';

import { Divider } from 'app/atoms';
import { ContentContainer } from 'app/layouts/ContentContainer';

import { EvmChainsSettings } from './EvmChains';
import { TezosChainsSettings } from './TezosChains';

const NetworksSettings = memo(() => {
  return (
    <ContentContainer className="my-6 px-2">
      <TezosChainsSettings />

      <Divider className="my-8" />

      <EvmChainsSettings />
    </ContentContainer>
  );
});

export default NetworksSettings;
