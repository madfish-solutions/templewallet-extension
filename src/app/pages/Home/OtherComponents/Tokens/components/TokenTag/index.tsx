import React from 'react';

import { TokenApyInfo } from 'app/hooks/use-token-apy.hook';
import { isTezAsset } from 'lib/assets';
import { isTruthy } from 'lib/utils';

import { TokenApyTag } from './ApyTag';
import { DelegateTezosTag } from './DelegateTag';
import { ScamTag } from './ScamTag';

interface TokenTagProps {
  assetSlug: string;
  assetSymbol: string;
  apyInfo?: TokenApyInfo;
  scam?: boolean;
}

export const TokenTag: React.FC<TokenTagProps> = ({ assetSlug, assetSymbol, apyInfo, scam }) => {
  if (isTezAsset(assetSlug)) return <DelegateTezosTag />;

  if (isTruthy(scam)) return <ScamTag assetSlug={assetSlug} />;

  if (isTruthy(apyInfo)) return <TokenApyTag slug={assetSlug} symbol={assetSymbol} apyInfo={apyInfo} />;

  return null;
};
