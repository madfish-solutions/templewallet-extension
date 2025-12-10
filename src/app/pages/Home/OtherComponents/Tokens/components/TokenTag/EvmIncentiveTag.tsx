import React, { FC, useMemo } from 'react';

import { TagButton } from 'app/atoms/TagButton';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { ETHERLINK_USDC_SLUG, APPLEFARM_REFERRAL_LINK } from 'lib/constants';
import { COMMON_MAINNET_CHAIN_IDS, ETHEREUM_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { isTruthy, openLink } from 'lib/utils';
import { navigate } from 'lib/woozie';
import { useEvmChainByChainId } from 'temple/front/chains';

import { AssetsSelectors } from '../../../Assets.selectors';

interface Props {
  chainId: number;
  assetSlug: string;
  symbol?: string;
}

type IncentiveInfo = { label: string; link: string; external?: boolean };

const INCENTIVE_TOKENS: Record<number, Record<string, IncentiveInfo>> = {
  [ETHEREUM_MAINNET_CHAIN_ID]: {
    [EVM_TOKEN_SLUG]: {
      label: 'APR: 3.4-10%',
      link: '/earn-eth'
    }
  },
  [COMMON_MAINNET_CHAIN_IDS.etherlink]: {
    [ETHERLINK_USDC_SLUG]: {
      label: 'APR: 12%',
      link: APPLEFARM_REFERRAL_LINK,
      external: true
    }
  }
};

export const EvmIncentiveTag: FC<Props> = ({ chainId, assetSlug, symbol }) => {
  const network = useEvmChainByChainId(chainId);

  const incentive = useMemo(() => INCENTIVE_TOKENS[chainId]?.[assetSlug], [chainId, assetSlug]);

  const onClick = useMemo(() => {
    if (!incentive) return;

    return (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      isTruthy(incentive.external)
        ? openLink(incentive.link)
        : navigate({
            pathname: incentive.link
          });
    };
  }, [incentive]);

  if (!incentive) return null;

  return (
    <TagButton
      onClick={onClick}
      testID={AssetsSelectors.assetItemApyButton}
      testIDProperties={{
        network: network?.name,
        slug: assetSlug,
        symbol,
        link: incentive.link
      }}
    >
      {incentive.label}
    </TagButton>
  );
};
