import React, { memo } from 'react';

import { EvmNetworkLogo } from 'app/atoms/NetworkLogo';

interface EvmPlanetItemProps {
  chainId: number;
  padding?: 'none' | 'small' | 'medium' | 'large';
}

const paddingClassNames = {
  none: '',
  small: 'p-[3px]',
  medium: 'p-1',
  large: 'p-1.5'
};

export const EvmPlanetItem = memo<EvmPlanetItemProps>(({ chainId, padding = 'small' }) => (
  <EvmNetworkLogo size={38} chainId={chainId} imgClassName={paddingClassNames[padding]} />
));
