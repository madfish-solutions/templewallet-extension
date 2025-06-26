import React, { FC, useCallback, useMemo } from 'react';

import clsx from 'clsx';

import { IconBase } from 'app/atoms';
import { CopyButton } from 'app/atoms/CopyButton';
import { IconButton } from 'app/atoms/IconButton';
import { ReactComponent as CopyIcon } from 'app/icons/base/copy.svg';
import { ReactComponent as QRCodeIcon } from 'app/icons/base/qr_code.svg';
import { ChainKindLabel } from 'app/templates/chain-kind-label';
import { setTestID } from 'lib/analytics';
import { t } from 'lib/i18n';
import { getStyledButtonColorsClassNames } from 'lib/ui/use-styled-button-or-link-props';
import { TempleChainKind } from 'temple/types';

import { ReceiveSelectors } from './Receive.selectors';
import { ReceivePayload } from './types';

interface NetworkCardProps extends ReceivePayload {
  onQRClick: SyncFn<ReceivePayload>;
}

export const NetworkCard: FC<NetworkCardProps> = ({ address, chainKind, onQRClick }) => {
  const handleQRClick = useCallback(() => onQRClick({ address, chainKind }), [address, chainKind, onQRClick]);
  const isTezos = chainKind === TempleChainKind.Tezos;

  const testIDProperties = useMemo(() => ({ chainKind }), [chainKind]);

  return (
    <div className="p-4 flex flex-col gap-y-2 bg-white rounded-lg shadow-bottom">
      <ChainKindLabel
        chainKind={chainKind}
        tooltipText={t(isTezos ? 'tezosReceiveTooltip' : 'evmReceiveTooltip')}
        wrapperClassName={isTezos ? 'mx-3' : undefined}
      />

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
