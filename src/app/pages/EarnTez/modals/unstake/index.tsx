import React, { memo } from 'react';

import { PageModal } from 'app/atoms/PageModal';
import { T } from 'lib/i18n';

interface UnstakeModalProps {
  onClose: EmptyFn;
}

export const UnstakeModal = memo<UnstakeModalProps>(({ onClose }) => (
  <PageModal title={<T id="unstakeTez" />} opened onRequestClose={onClose}>
    <span>TODO: add content</span>
  </PageModal>
));
