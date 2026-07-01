import React from 'react';

import { TempleChainKind } from 'temple/types';

import * as messaging from '../../messaging';

interface SwapButtonProps {
  chainKind: TempleChainKind;
  chainId: string;
  assetSlug: string;
}

export const SwapButton = ({ chainKind, chainId, assetSlug }: SwapButtonProps) => {
  const handleClick = () => {
    const gasSlug = chainKind === TempleChainKind.Tezos ? 'tez' : 'eth';
    const from = `${chainKind}/${chainId}/${gasSlug}`;
    const to = `${chainKind}/${chainId}/${assetSlug}`;
    messaging.trackWebWidgetEvent('Web Token Widget / Swap').catch(() => {});
    messaging.openFullPage(`#/swap?from=${from}&to=${to}&fromBalance=1`).catch(() => {});
  };

  return (
    <button className="tw-card__cta tw-card__cta--primary" type="button" onClick={handleClick}>
      Swap
    </button>
  );
};
