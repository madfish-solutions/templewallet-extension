import React, { memo } from 'react';

import { QRCode } from 'app/atoms';
import {
  ActionModal,
  ActionModalBodyContainer,
  ActionModalButton,
  ActionModalButtonsContainer
} from 'app/atoms/action-modal';
import { EvmNetworksLogos, TezosNetworkLogo } from 'app/atoms/NetworksLogos';
import { T, t } from 'lib/i18n';
import { TempleChainKind, TempleChainTitle } from 'temple/types';

import { ReceivePayload } from './types';

interface ReceiveModalProps extends ReceivePayload {
  onClose: EmptyFn;
}

export const ReceiveModal = memo<ReceiveModalProps>(({ address, chainKind, onClose }) => {
  return (
    <ActionModal title={t('networkAddress', TempleChainTitle[chainKind])} closable onClose={onClose}>
      <ActionModalBodyContainer className="items-center">
        <div className="mb-4 rounded-lg shadow-center overflow-hidden p-4">
          <QRCode size={188} data={address} />
        </div>
        <div className="mb-3">
          {chainKind === TempleChainKind.Tezos ? <TezosNetworkLogo size={9} /> : <EvmNetworksLogos size={9} />}
        </div>
        <span className="text-font-description text-grey-1 mb-2">
          <T id="sendOnlySomeNetworkTokens" substitutions={[TempleChainTitle[chainKind]]} />
        </span>
      </ActionModalBodyContainer>
      <ActionModalButtonsContainer>
        <ActionModalButton color="primary-low" onClick={onClose}>
          <T id="close" />
        </ActionModalButton>
      </ActionModalButtonsContainer>
    </ActionModal>
  );
});
