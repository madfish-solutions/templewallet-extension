import React, { memo } from 'react';

import { PageModal } from 'app/atoms/PageModal';
import { T } from 'lib/i18n';

interface RewardsModalProps {
  chainId: string;
  isOpen: boolean;
  onClose: EmptyFn;
}

export const RewardsModal = memo<RewardsModalProps>(({ isOpen, onClose }) => (
  <PageModal title={<T id="rewardsActivity" />} opened={isOpen} onRequestClose={onClose} titleRight={null}>
    <span>TODO: add content</span>
  </PageModal>
));
