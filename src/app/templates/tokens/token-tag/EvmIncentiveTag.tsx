import React, { FC, useMemo } from 'react';

import { TagButton } from 'app/atoms/TagButton';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { ETHEREUM_APR } from 'lib/constants';
import { ETHEREUM_HOODI_CHAIN_ID, ETHEREUM_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { navigate } from 'lib/woozie';
import { useEvmChainByChainId } from 'temple/front/chains';

import { AssetsSelectors } from '../assets.selectors';

interface Props {
  chainId: number;
  assetSlug: string;
  symbol?: string;
}

type IncentiveInfo = { label: string; link: string };

const INCENTIVE_TOKENS: Record<number, Record<string, IncentiveInfo>> = {
  [ETHEREUM_MAINNET_CHAIN_ID]: {
    [EVM_TOKEN_SLUG]: {
      label: `APR: ${ETHEREUM_APR}%`,
      link: '/earn-eth'
    }
  },
  [ETHEREUM_HOODI_CHAIN_ID]: {
    [EVM_TOKEN_SLUG]: {
      label: `APR: ${ETHEREUM_APR}%`,
      link: '/earn-eth'
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

      navigate({ pathname: incentive.link });
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
