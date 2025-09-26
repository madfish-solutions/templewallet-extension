import React, { FC, useMemo } from 'react';

import { TagButton } from 'app/atoms/TagButton';
import { COMMON_MAINNET_CHAIN_IDS } from 'lib/temple/types';
import { openLink } from 'lib/utils';

import { AssetsSelectors } from '../../../Assets.selectors';

interface Props {
  chainId: number;
  assetSlug: string;
  symbol?: string;
}

type IncentiveInfo = { label: string; link: string };

const INCENTIVE_TOKENS: Record<number, Record<string, IncentiveInfo>> = {
  [COMMON_MAINNET_CHAIN_IDS.etherlink]: {
    '0x796Ea11Fa2dD751eD01b53C372fFDB4AAa8f00F9_0': {
      // USDC
      label: 'APY 28%',
      link: 'https://app.applefarm.xyz/referral?code=APPLE-FARM-880788'
    }
  }
};

export const EvmIncentiveTag: FC<Props> = ({ chainId, assetSlug, symbol }) => {
  const incentive = useMemo(() => INCENTIVE_TOKENS[chainId]?.[assetSlug], [chainId, assetSlug]);

  const onClick = useMemo(() => {
    if (!incentive) return;

    return (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      openLink(incentive.link);
    };
  }, [incentive]);

  if (!incentive) return null;

  return (
    <TagButton
      onClick={onClick}
      testID={AssetsSelectors.assetItemApyButton}
      testIDProperties={{
        chainId,
        slug: assetSlug,
        symbol,
        link: incentive.link
      }}
    >
      {incentive.label}
    </TagButton>
  );
};
