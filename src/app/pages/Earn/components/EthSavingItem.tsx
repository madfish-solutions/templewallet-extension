import React from 'react';

import { ETH_SAVING_OFFER } from '../config';

import { EarnItem } from './EarnItem';

export const EthSavingItem = () => {
  // TODO: Add active deposit state

  return <EarnItem offer={ETH_SAVING_OFFER} />;
};
