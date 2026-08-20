import React from 'react';

import { toTopUpTokenSlug } from 'lib/buy-with-credit-card/top-up-token-slug.utils';
import { TempleChainKind } from 'temple/types';

import * as messaging from '../../messaging';

interface BuyButtonProps {
  tokenAddress: string | null;
  tokenId: number | undefined;
  chainKind: TempleChainKind;
  chainId: string;
  fiat: string;
}

export const BuyButton = ({ tokenAddress, tokenId, chainKind, chainId, fiat }: BuyButtonProps) => {
  const handleClick = () => {
    const token = toTopUpTokenSlug(tokenAddress, tokenId, chainKind, chainId);
    messaging.trackWebWidgetEvent('Web Token Widget / Buy').catch(() => {});
    messaging
      .openFullPage(`#/buy/card?currency=${encodeURIComponent(fiat)}&token=${encodeURIComponent(token)}`)
      .catch(() => {});
  };

  return (
    <button className="tw-card__cta tw-card__cta--primary" type="button" onClick={handleClick}>
      Buy
    </button>
  );
};
