import React, { memo } from 'react';

import { PageModal } from 'app/atoms/PageModal';
import { T } from 'lib/i18n';

interface ClaimModalProps {
  onRequestClose: EmptyFn;
}

export const ClaimModal = memo<ClaimModalProps>(({ onRequestClose }) => {
  return (
    <PageModal
      title={<T id="claim" />}
      opened
      titleRight={undefined}
      onGoBack={undefined}
      onRequestClose={onRequestClose}
    >
      <div>ClaimModal</div>
    </PageModal>
  );
});
