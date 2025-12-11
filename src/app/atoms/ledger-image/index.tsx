import React, { ImgHTMLAttributes, memo } from 'react';

import { TempleChainKind } from 'temple/types';

import connectEvmImage from './assets/connect-evm.png';
import connectTezHcImage from './assets/connect-tez-hc.png';
import connectTezImage from './assets/connect-tez.png';
import failEvmImage from './assets/fail-evm.png';
import failTezHcImage from './assets/fail-tez-hc.png';
import failTezImage from './assets/fail-tez.png';
import failYellowEvmImage from './assets/fail-yellow-evm.png';
import failYellowTezHcImage from './assets/fail-yellow-tez-hc.png';
import failYellowTezImage from './assets/fail-yellow-tez.png';
import lookingEvmImage from './assets/looking-evm.png';
import lookingTezHcImage from './assets/looking-tez-hc.png';
import lookingTezImage from './assets/looking-tez.png';
import successEvmImage from './assets/success-evm.png';
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

const evmImages = {
  [LedgerImageState.Connect]: connectEvmImage,
  [LedgerImageState.Fail]: failEvmImage,
  [LedgerImageState.Looking]: lookingEvmImage,
  [LedgerImageState.Success]: successEvmImage,
  [LedgerImageState.FailYellow]: failYellowEvmImage
};

interface LedgerImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  state: LedgerImageState;
  variant?: LedgerImageVariant;
  chainKind?: TempleChainKind;
}

export const LedgerImage = memo<LedgerImageProps>(
  ({ state, variant = LedgerImageVariant.Open, chainKind, alt = '', ...restProps }) => {
    const src = chainKind === TempleChainKind.EVM ? evmImages[state] : images[state][variant];
    return <img src={src} alt={alt} {...restProps} />;
  }
);
