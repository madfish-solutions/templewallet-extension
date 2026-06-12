import { FC, ReactNode } from 'react';

import Autoplay from 'embla-carousel-autoplay';
import useEmblaCarousel from 'embla-carousel-react';

import { EvmAssetIconWithNetwork, TezosAssetIconWithNetwork } from 'app/templates/AssetIcon';
import { CardWithChevron } from 'app/templates/card-with-chevron';
import { EVM_TOKEN_SLUG, TEZ_TOKEN_SLUG } from 'lib/assets/defaults';
import { ETHEREUM_APR, TEZOS_APY } from 'lib/constants';
import { T } from 'lib/i18n';
import { ETHEREUM_MAINNET_CHAIN_ID, TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';

import { HomeSelectors } from '../../selectors';

export const EarnNoDepositsCard = () => {
  const [emblaRef] = useEmblaCarousel({ loop: true, watchDrag: false }, [Autoplay({ delay: 10000 })]);

  return (
    <CardWithChevron
      title={
        <span className="text-font-description-bold">
          <T id="earn" />
        </span>
      }
      linkTo="/earn"
      testID={HomeSelectors.earnSectionCard}
      wholeCardIsLink
      className="min-h-25"
      cardContentClassName="flex-1"
    >
      <div className="embla my-auto">
        <div className="embla__viewport" ref={emblaRef}>
          <div className="embla__container">
            <div className="embla__slide">
              <EarnOpportunityItem
                Icon={
                  <TezosAssetIconWithNetwork
                    assetSlug={TEZ_TOKEN_SLUG}
                    tezosChainId={TEZOS_MAINNET_CHAIN_ID}
                    size={24}
                  />
                }
                symbol="TEZ"
                displayRate={`${TEZOS_APY}% APY`}
              />
            </div>
            <div className="embla__slide">
              <EarnOpportunityItem
                Icon={
                  <EvmAssetIconWithNetwork
                    assetSlug={EVM_TOKEN_SLUG}
                    evmChainId={ETHEREUM_MAINNET_CHAIN_ID}
                    size={24}
                  />
                }
                symbol="ETH"
                displayRate={`${ETHEREUM_APR}% APR`}
              />
            </div>
          </div>
        </div>
      </div>
    </CardWithChevron>
  );
};

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
