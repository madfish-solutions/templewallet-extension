import React, { ImgHTMLAttributes, memo } from 'react';

import connectTezHcImage from './assets/connect-tez-hc.png';
import connectTezImage from './assets/connect-tez.png';
import failTezHcImage from './assets/fail-tez-hc.png';
import failTezImage from './assets/fail-tez.png';
import failYellowTezHcImage from './assets/fail-yellow-tez-hc.png';
import failYellowTezImage from './assets/fail-yellow-tez.png';
import lookingTezHcImage from './assets/looking-tez-hc.png';
import lookingTezImage from './assets/looking-tez.png';
import successTezHcImage from './assets/success-tez-hc.png';
import successTezImage from './assets/success-tez.png';

export enum LedgerImageState {
  Looking = 'looking',
  Success = 'success',
  Fail = 'fail',
  FailYellow = 'fail-yellow',
  Connect = 'connect'
}

export enum LedgerImageVariant {
  Open = 'open',
  HalfClosed = 'half-closed'
}

const images = {
  [LedgerImageState.Connect]: {
    [LedgerImageVariant.Open]: connectTezImage,
    [LedgerImageVariant.HalfClosed]: connectTezHcImage
  },
  [LedgerImageState.Fail]: {
    [LedgerImageVariant.Open]: failTezImage,
    [LedgerImageVariant.HalfClosed]: failTezHcImage
  },
  [LedgerImageState.Looking]: {
    [LedgerImageVariant.Open]: lookingTezImage,
    [LedgerImageVariant.HalfClosed]: lookingTezHcImage
  },
  [LedgerImageState.Success]: {
    [LedgerImageVariant.Open]: successTezImage,
    [LedgerImageVariant.HalfClosed]: successTezHcImage
  },
  [LedgerImageState.FailYellow]: {
    [LedgerImageVariant.Open]: failYellowTezImage,
    [LedgerImageVariant.HalfClosed]: failYellowTezHcImage
  }
};

interface LedgerImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  state: LedgerImageState;
  variant?: LedgerImageVariant;
  /* TODO: add a property for chain */
}

export const LedgerImage = memo<LedgerImageProps>(
  ({ state, variant = LedgerImageVariant.Open, alt = '', ...restProps }) => (
    <img src={images[state][variant]} alt={alt} {...restProps} />
  )
);
