import React, { memo } from 'react';

import { QRCode } from 'app/atoms';
import { ActionModal, ActionModalBodyContainer } from 'app/atoms/action-modal';
import { EvmNetworksLogos, TezNetworkLogo } from 'app/atoms/NetworksLogos';
import { T, t } from 'lib/i18n';
import { TempleChainKind, TempleChainTitle } from 'temple/types';

import { ReceivePayload } from './types';

interface ReceiveModalProps extends ReceivePayload {
  onClose: EmptyFn;
}

export const ReceiveModal = memo<ReceiveModalProps>(({ address, chainKind, onClose }) => {
  return (
    <ActionModal title={t('networkAddress', TempleChainTitle[chainKind])} hasCloseButton onClose={onClose}>
      <ActionModalBodyContainer className="items-center pb-4">
        <div className="mb-4 rounded-lg shadow-center overflow-hidden p-4">
          <QRCode size={188} data={address} />
        </div>
        <div className="mb-3">
          {chainKind === TempleChainKind.Tezos ? <TezNetworkLogo size={36} /> : <EvmNetworksLogos size={36} />}
        </div>
        <span className="text-font-description text-grey-1 mb-2">
          <T id="sendOnlySomeNetworkTokens" substitutions={[TempleChainTitle[chainKind]]} />
        </span>
      </ActionModalBodyContainer>
    </ActionModal>
  );
});
