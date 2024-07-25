import React, { FC, useCallback, useMemo } from 'react';

import clsx from 'clsx';

import { IconBase } from 'app/atoms';
import { CopyButton } from 'app/atoms/CopyButton';
import { IconButton } from 'app/atoms/IconButton';
import { EvmNetworksLogos, TezosNetworkLogo } from 'app/atoms/NetworksLogos';
import { useRichFormatTooltip } from 'app/hooks/use-rich-format-tooltip';
import { ReactComponent as CopyIcon } from 'app/icons/base/copy.svg';
import { ReactComponent as QRCodeIcon } from 'app/icons/base/qr_code.svg';
import { setTestID } from 'lib/analytics';
import { t } from 'lib/i18n';
import { getStyledButtonColorsClassNames } from 'lib/ui/button-like-styles';
import { UseTippyOptions } from 'lib/ui/useTippy';
import { TempleChainKind, TempleChainTitle } from 'temple/types';

import { ReceiveSelectors } from './Receive.selectors';
import { ReceivePayload } from './types';

interface NetworkCardProps extends ReceivePayload {
  onQRClick: SyncFn<ReceivePayload>;
}

export const NetworkCard: FC<NetworkCardProps> = ({ address, chainKind, onQRClick }) => {
  const handleQRClick = useCallback(() => onQRClick({ address, chainKind }), [address, chainKind, onQRClick]);
  const isTezos = chainKind === TempleChainKind.Tezos;

  const tooltipContent = t(isTezos ? 'tezosReceiveTooltip' : 'evmReceiveTooltip');
  const tooltipWrapperFactory = useCallback(() => {
    const element = document.createElement('div');
    element.className = clsx('text-center', !isTezos && 'mx-3');

    return element;
  }, [isTezos]);
  const basicTooltipProps = useMemo<Omit<UseTippyOptions, 'content'>>(
    () => ({
      trigger: 'mouseenter',
      hideOnClick: true,
      animation: 'shift-away-subtle',
      placement: 'bottom-start' as const,
      offset: [isTezos ? 0 : 10, 15]
    }),
    [isTezos]
  );
  const tooltipWrapperRef = useRichFormatTooltip<HTMLDivElement>(
    basicTooltipProps,
    tooltipWrapperFactory,
    tooltipContent
  );
  const testIDProperties = useMemo(() => ({ chainKind }), [chainKind]);

  return (
    <div className="p-4 flex flex-col gap-y-2 bg-white rounded-lg shadow-bottom">
      <div className="flex gap-x-2">
        <span className="text-font-regular-bold">{TempleChainTitle[chainKind]}</span>
        <div ref={tooltipWrapperRef}>
          {chainKind === TempleChainKind.Tezos ? <TezosNetworkLogo /> : <EvmNetworksLogos />}
        </div>
      </div>

      <div className="flex gap-x-2 items-center">
        <span
          className="mr-4 flex-1 text-font-description text-grey-1 break-words overflow-auto"
          {...setTestID(ReceiveSelectors.addressValue)}
        >
          {address}
        </span>
        <CopyButton
          text={address}
          className={clsx('p-1 rounded-md', getStyledButtonColorsClassNames('secondary-low'))}
          testID={ReceiveSelectors.copyToClipboardButton}
          testIDProperties={testIDProperties}
        >
          <IconBase Icon={CopyIcon} size={16} />
        </CopyButton>
        <IconButton
          Icon={QRCodeIcon}
          color="blue"
          onClick={handleQRClick}
          testID={ReceiveSelectors.openQRCodeButton}
          testIDProperties={testIDProperties}
        />
      </div>
    </div>
  );
};
