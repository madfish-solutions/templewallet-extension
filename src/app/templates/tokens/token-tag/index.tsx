import { memo } from 'react';

import { ScamTag } from 'app/templates/scam-tag';
import { isTezAsset } from 'lib/assets';
import { TezosNetworkEssentials } from 'temple/networks';

import { DelegateTezosTag } from './DelegateTag';

interface Props {
  network: TezosNetworkEssentials;
  tezPkh: string;
  assetSlug: string;
  scam?: boolean;
}

export const TokenTag = memo<Props>(({ network, tezPkh, assetSlug, scam }) => {
  if (isTezAsset(assetSlug)) return <DelegateTezosTag network={network} pkh={tezPkh} />;

  if (scam) return <ScamTag className="-ml-1.5" />;

  return null;
});
