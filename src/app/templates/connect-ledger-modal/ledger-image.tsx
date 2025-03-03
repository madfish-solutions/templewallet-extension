import React, { memo } from 'react';

import connectTezImage from './connect-tez.png';
import failTezImage from './fail-tez.png';
import lookingTezImage from './looking-tez.png';
import successTezImage from './success-tez.png';

export enum LedgerImageVariant {
  Looking = 'looking',
  Success = 'success',
  Fail = 'fail',
  Connect = 'connect'
}

const images = {
  [LedgerImageVariant.Connect]: connectTezImage,
  [LedgerImageVariant.Fail]: failTezImage,
  [LedgerImageVariant.Looking]: lookingTezImage,
  [LedgerImageVariant.Success]: successTezImage
};

interface LedgerImageProps {
  variant: LedgerImageVariant;
  /* TODO: add a property for chain */
}

export const LedgerImage = memo<LedgerImageProps>(({ variant }) => <img src={images[variant]} alt="" />);
