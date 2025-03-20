import React, { memo } from 'react';

import { PageModal } from 'app/atoms/PageModal';
import { T } from 'lib/i18n';

interface StakeModalProps {
  onClose: EmptyFn;
}

export const StakeModal = memo<StakeModalProps>(({ onClose }) => (
  <PageModal title={<T id="tezosStaking" />} opened onRequestClose={onClose}>
    <span>TODO: add content</span>
  </PageModal>
));
