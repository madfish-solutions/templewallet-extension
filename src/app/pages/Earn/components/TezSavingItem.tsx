import React from 'react';

import { TEZ_SAVING_OFFER } from '../config';

import { EarnItem } from './EarnItem';

export const TezSavingItem = () => {
  // TODO: Add active deposit state

  return <EarnItem offer={TEZ_SAVING_OFFER} />;
};
