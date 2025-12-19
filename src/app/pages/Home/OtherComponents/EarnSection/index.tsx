import React, { FC, memo, ReactNode } from 'react';

import clsx from 'clsx';

import { AnimatedMenuChevron } from 'app/atoms/animated-menu-chevron';
import { KoloCryptoCardPreview } from 'app/pages/Home/OtherComponents/KoloCard/KoloCryptoCardPreview';
import { EvmAssetIconWithNetwork, TezosAssetIconWithNetwork } from 'app/templates/AssetIcon';
import { EVM_TOKEN_SLUG, TEZ_TOKEN_SLUG } from 'lib/assets/defaults';
import { ETHEREUM_APR, TEZOS_APY } from 'lib/constants';
import { T } from 'lib/i18n';
import { ETHEREUM_MAINNET_CHAIN_ID, TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { useActivateAnimatedChevron } from 'lib/ui/hooks/use-activate-animated-chevron';
import { Link } from 'lib/woozie';

import { HomeSelectors } from '../../selectors';

interface EarnSectionProps {
  className?: string;
  openCryptoCardModal: EmptyFn;
}

export const EarnSection = memo<EarnSectionProps>(({ className, openCryptoCardModal }) => {
  const { animatedChevronRef, handleHover, handleUnhover } = useActivateAnimatedChevron();

  return (
    <div className={clsx('flex flex-col relative pb-[68px]', className)}>
      <KoloCryptoCardPreview onClick={openCryptoCardModal} />

      <Link
        to="/earn"
        className={
          'relative -mb-[68px] px-4 transform transition-transform duration-200 ease-out peer-hover:translate-y-2'
        }
        onMouseEnter={handleHover}
        onMouseLeave={handleUnhover}
        testID={HomeSelectors.earnSectionCard}
      >
        <div className="flex flex-col rounded-8 pb-1 px-1 border-0.5 border-lines bg-white">
          <div className="flex items-center justify-between p-2 rounded-8 overflow-hidden">
            <span className="text-font-description-bold p-1">
              <T id="earn" />
            </span>
            <AnimatedMenuChevron ref={animatedChevronRef} />
          </div>

          <div className="flex flex-row rounded-8 p-3 pb-2 gap-4 bg-background">
            <EarnOpportunityItem
              Icon={
                <EvmAssetIconWithNetwork assetSlug={EVM_TOKEN_SLUG} evmChainId={ETHEREUM_MAINNET_CHAIN_ID} size={24} />
              }
              symbol="ETH"
              displayRate={`${ETHEREUM_APR}% APR`}
            />
            <EarnOpportunityItem
              Icon={
                <TezosAssetIconWithNetwork assetSlug={TEZ_TOKEN_SLUG} tezosChainId={TEZOS_MAINNET_CHAIN_ID} size={24} />
              }
              symbol="TEZ"
              displayRate={`${TEZOS_APY}% APY`}
            />
          </div>
        </div>
      </Link>
    </div>
  );
});

interface EarnOpportunityItemProps {
  Icon?: ReactNode;
  symbol: string;
  displayRate: string;
}

const EarnOpportunityItem: FC<EarnOpportunityItemProps> = ({ Icon, symbol, displayRate }) => (
  <div className="flex items-center justify-center gap-2 px-2">
    {Icon}

    <div className="flex items-center gap-1 whitespace-nowrap">
      <span className="text-font-description-bold">{symbol}</span>
      <span className="text-font-num-12 text-grey-1">{displayRate}</span>
    </div>
  </div>
);
