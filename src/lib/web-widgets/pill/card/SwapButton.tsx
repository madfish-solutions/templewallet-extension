import React from 'react';

import { EVM_TOKEN_SLUG, TEZ_TOKEN_SLUG } from 'lib/assets/defaults';
import { TempleChainKind } from 'temple/types';

import * as messaging from '../../messaging';

interface SwapButtonProps {
  chainKind: TempleChainKind;
  chainId: string;
  assetSlug: string;
}

export const SwapButton = ({ chainKind, chainId, assetSlug }: SwapButtonProps) => {
  const handleClick = () => {
    const gasSlug = chainKind === TempleChainKind.Tezos ? TEZ_TOKEN_SLUG : EVM_TOKEN_SLUG;
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
