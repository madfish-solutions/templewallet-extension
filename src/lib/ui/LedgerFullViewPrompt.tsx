import React, { useMemo } from 'react';

import { LedgerImage, LedgerImageState, LedgerImageVariant } from 'app/atoms';
import { PageModal } from 'app/atoms/PageModal';
import { StyledButton } from 'app/atoms/StyledButton';
import { PageModalScrollViewWithActions } from 'app/templates/page-modal-scroll-view-with-actions';
import { T, t } from 'lib/i18n';

export interface LedgerFullViewPromptModalProps {
  opened: boolean;
  onClose: EmptyFn;
  onProceed: EmptyFn;
}

export const LedgerFullViewPromptModal: React.FC<LedgerFullViewPromptModalProps> = ({ opened, onClose, onProceed }) => {
  const promptSteps = useMemo(
    () => [
      'Check if your Ledger is plugged in',
      <span key="step-2">
        Enable <span className="font-semibold">smart contract data</span> or{' '}
        <span className="font-semibold">blind signing</span>
      </span>,
      'Continue in full screen mode'
    ],
    []
  );

  return (
    <PageModal
      title={t('ledgerConnect')}
      titleLeft={null}
      opened={opened}
      onRequestClose={onClose}
      shouldChangeBottomShift={false}
    >
      <PageModalScrollViewWithActions
        actionsBoxProps={{
          shouldChangeBottomShift: false,
          children: (
            <StyledButton size="L" color="primary" className="w-full" onClick={onProceed}>
              <T id="continue" />
            </StyledButton>
          )
        }}
      >
        <div className="flex flex-col items-center text-center">
          <LedgerImage
            state={LedgerImageState.Looking}
            variant={LedgerImageVariant.HalfClosed}
            className="w-72 -mt-12"
          />
          <p className="text-font-regular-bold -mt-14">{t('ledgerEnsureConnectionTitle')}</p>
          <div className="flex flex-col w-full gap-2 px-2 my-4">
            {promptSteps.map((content, index) => (
              <div key={index} className="flex items-center gap-2 rounded-8 border bg-grey-4 border-lines p-3">
                <div className="text-lg font-medium w-5">{index + 1}</div>
                <div className="text-font-description">{content}</div>
              </div>
            ))}
          </div>
        </div>
      </PageModalScrollViewWithActions>
    </PageModal>
  );
};
