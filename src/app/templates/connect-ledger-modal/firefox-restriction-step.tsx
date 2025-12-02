import React, { memo } from 'react';

import { FadeTransition } from 'app/a11y/FadeTransition';
import { LedgerImage, LedgerImageState } from 'app/atoms';
import { StyledButton } from 'app/atoms/StyledButton';
import { T, t } from 'lib/i18n';
import { TempleChainKind } from 'temple/types';

import { PageModalScrollViewWithActions } from '../page-modal-scroll-view-with-actions';

import { ConnectLedgerModalSelectors } from './selectors';

interface FirefoxRestrictionStepProps {
  onClose: EmptyFn;
}

export const FirefoxRestrictionStep = memo<FirefoxRestrictionStepProps>(({ onClose }) => {
  return (
    <FadeTransition>
      <PageModalScrollViewWithActions
        className="!px-0"
        actionsBoxProps={{
          shouldChangeBottomShift: false,
          children: (
            <StyledButton
              size="L"
              className="w-full"
              color="primary"
              onClick={onClose}
              testID={ConnectLedgerModalSelectors.firefoxRestrictionButton}
            >
              <T id="okGotIt" />
            </StyledButton>
          )
        }}
      >
        <LedgerImage state={LedgerImageState.Fail} chainKind={TempleChainKind.EVM} className="w-full" />
        <div className="flex flex-col items-center px-4">
          <p className="text-font-regular-bold text-center mb-2">{t('notAvailableOnFirefox')}</p>
          <p className="text-font-description text-grey-1 text-center mb-6 px-1">
            {t('ledgerNotAvailableOnFirefoxDescription')}
          </p>
        </div>
      </PageModalScrollViewWithActions>
    </FadeTransition>
  );
});
