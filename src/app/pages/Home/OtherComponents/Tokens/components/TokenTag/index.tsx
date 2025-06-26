import React, { memo } from 'react';

import { isTezAsset } from 'lib/assets';
import { TezosNetworkEssentials } from 'temple/networks';

import { TokenApyTag } from './ApyTag';
import { DelegateTezosTag } from './DelegateTag';
import { ScamTag } from './ScamTag';

interface Props {
  network: TezosNetworkEssentials;
  tezPkh: string;
  assetSlug: string;
  assetSymbol: string;
  scam?: boolean;
}

export const TokenTag = memo<Props>(({ network, tezPkh, assetSlug, assetSymbol, scam }) => {
  if (isTezAsset(assetSlug)) return <DelegateTezosTag network={network} pkh={tezPkh} />;

  if (scam) return <ScamTag className="-ml-1.5" />;

  return <TokenApyTag slug={assetSlug} symbol={assetSymbol} />;
});
