import { FC } from 'react';

import clsx from 'clsx';

import { IconBase } from 'app/atoms';
import { Anchor } from 'app/atoms/Anchor';
import { FloatingCloseButton } from 'app/atoms/FloatingCloseButton';
import { ReactComponent as OutLinkIcon } from 'app/icons/base/outLink.svg';
import { ReactComponent as EtherlinkIcon } from 'app/icons/etherlink.svg';
import { FilterChain } from 'app/store/assets-filter-options/state';
import { AD_HIDING_TIMEOUT } from 'lib/constants';
import { T } from 'lib/i18n';
import { useStorage } from 'lib/temple/front';
import { ETHERLINK_MAINNET_CHAIN_ID, TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { TempleChainKind } from 'temple/types';

import { SWAP_BRIDGE_CARD_SNOOZED_UNTIL_STORAGE_KEY } from '../../constants';
import { SwapFieldName } from '../../form/interfaces';

import { SwapSelectAssetModalSelectors } from './selectors';

export type BridgeDirection = 'tezos-to-etherlink' | 'etherlink-to-tezos';

const BRIDGE_CARD_HEIGHT = 56;

export const getBridgeDirection = (
  activeField: SwapFieldName,
  chain: FilterChain,
  snoozedUntil: number
): BridgeDirection | undefined => {
  if (activeField !== 'output' || Date.now() < snoozedUntil) return undefined;

  if (chain?.kind === TempleChainKind.Tezos && chain.chainId === TEZOS_MAINNET_CHAIN_ID) return 'tezos-to-etherlink';

  if (chain?.kind === TempleChainKind.EVM && chain.chainId === ETHERLINK_MAINNET_CHAIN_ID) return 'etherlink-to-tezos';

  return undefined;
};

interface BridgeCardProps {
  direction: BridgeDirection;
  className?: string;
}

export const BridgeCard: FC<BridgeCardProps> = ({ direction, className }) => {
  const [, setSnoozedUntil] = useStorage<number>(SWAP_BRIDGE_CARD_SNOOZED_UNTIL_STORAGE_KEY, 0);

  const testIDProperties = { direction };

  const handleCloseClick = () => void setSnoozedUntil(Date.now() + AD_HIDING_TIMEOUT);

  return (
    <div className={clsx('relative group', className)}>
      <Anchor
        href="https://bridge.etherlink.com/tezos"
        className="flex items-center gap-2 p-2 rounded-lg bg-grey-4 group-hover:bg-secondary-low"
        style={{ height: BRIDGE_CARD_HEIGHT }}
        testID={SwapSelectAssetModalSelectors.bridgeCard}
        testIDProperties={testIDProperties}
      >
        <div className="size-10 flex items-center justify-center shrink-0">
          <div className="size-7.5 rounded-circle bg-[#151515] flex items-center justify-center">
            <EtherlinkIcon className="size-5" />
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-1 overflow-hidden">
          <span className="text-font-medium truncate">
            <T id={direction === 'tezos-to-etherlink' ? 'bridgeTezosToEtherlink' : 'bridgeEtherlinkToTezos'} />
          </span>
          <span className="text-font-description text-grey-1 truncate">
            <T id="bridgeCardDescription" />
          </span>
        </div>

        <IconBase
          Icon={OutLinkIcon}
          size={16}
          className="text-secondary shrink-0 group-hover:invisible group-focus-within:invisible"
        />
      </Anchor>

      <FloatingCloseButton
        className={clsx(
          'opacity-0 pointer-events-none',
          'group-hover:opacity-100 group-hover:pointer-events-auto',
          'group-focus-within:opacity-100 group-focus-within:pointer-events-auto'
        )}
        testID={SwapSelectAssetModalSelectors.bridgeCardCloseButton}
        testIDProperties={testIDProperties}
        onClick={handleCloseClick}
      />
    </div>
  );
};
