import React from 'react';

import { isTezAsset } from 'lib/assets';

import { TokenApyTag } from './ApyTag';
import { DelegateTezosTag } from './DelegateTag';
import { ScamTag } from './ScamTag';

interface Props {
  tezPkh: string;
  assetSlug: string;
  assetSymbol: string;
  scam?: boolean;
}

export const TokenTag = React.memo<Props>(({ tezPkh, assetSlug, assetSymbol, scam }) => {
  if (isTezAsset(assetSlug)) return <DelegateTezosTag pkh={tezPkh} />;

  if (scam) return <ScamTag assetSlug={assetSlug} tezPkh={tezPkh} />;

  return <TokenApyTag slug={assetSlug} symbol={assetSymbol} />;
});
