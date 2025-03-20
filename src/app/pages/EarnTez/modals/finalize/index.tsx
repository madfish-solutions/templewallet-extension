import React, { memo } from 'react';

import { PageModal } from 'app/atoms/PageModal';
import { T } from 'lib/i18n';

interface FinalizeModalProps {
  onClose: EmptyFn;
}

export const FinalizeModal = memo<FinalizeModalProps>(({ onClose }) => (
  <PageModal title={<T id="finalizeUnstake" />} opened onRequestClose={onClose} titleRight={null}>
    <span>TODO: add content</span>
  </PageModal>
));
