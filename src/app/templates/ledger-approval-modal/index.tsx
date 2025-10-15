import React, { memo, useMemo } from 'react';

import clsx from 'clsx';
import Modal from 'react-modal';

import { IconBase, LedgerImage, LedgerImageVariant } from 'app/atoms';
import { Button } from 'app/atoms/Button';
import CustomModal from 'app/atoms/CustomModal';
import { useAppEnv } from 'app/env';
import { ReactComponent as CloseIcon } from 'app/icons/base/x.svg';
import {
  FULL_PAGE_LAYOUT_CONTAINER_CLASSNAME,
  FULL_PAGE_WRAP_OVERLAY_CLASSNAME,
  LAYOUT_CONTAINER_CLASSNAME
} from 'app/layouts/containers';
import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { t } from 'lib/i18n';
import { LedgerOperationState, LedgerUIConfigurationBase, makeStateToUIConfiguration } from 'lib/ui';

import styles from './ledger-approval-modal.module.css';

interface ApprovalModalProps {
  state: LedgerOperationState;
  isSwitchingDerivation?: boolean;
  onClose: Modal.Props['onRequestClose'];
}

interface UIConfiguration extends LedgerUIConfigurationBase {
  title: string;
  description: string;
}

export const LedgerApprovalModal = memo<ApprovalModalProps>(({ isSwitchingDerivation, state, onClose }) => {
  const { fullPage, confirmWindow } = useAppEnv();
  const testnetModeEnabled = useTestnetModeEnabledSelector();

  const stateToUIConfiguration = useMemo(() => {
    const rejectionI18nKey = isSwitchingDerivation
      ? 'ledgerRejectedSwitchDerivationDescription'
      : 'ledgerRejectedDescription';

    return makeStateToUIConfiguration<UIConfiguration>({
      [LedgerOperationState.NotStarted]: {
        title: t('waitingForApprove'),
        description: t('waitingForLedgerApproveDescription')
      },
      [LedgerOperationState.InProgress]: {
        title: t('waitingForApprove'),
        description: t('waitingForLedgerApproveDescription')
      },
      [LedgerOperationState.Success]: {
        title: t('approved'),
        description: t('ledgerApprovedDescription')
      },
      [LedgerOperationState.Canceled]: {
        title: t('rejected'),
        description: t(rejectionI18nKey)
      },
      [LedgerOperationState.AppNotReady]: {
        title: t('rejected'),
        description: t(rejectionI18nKey)
      },
      [LedgerOperationState.UnableToConnect]: {
        title: t('unableToConnect'),
        description: t('unableToConnectLedgerApproveDescription')
      }
    });
  }, [isSwitchingDerivation]);
  const { imageState, icon, title, description } = stateToUIConfiguration[state];

  if (state === LedgerOperationState.NotStarted) {
    return null;
  }

  return (
    <CustomModal
      isOpen
      className="rounded-lg"
      overlayClassName={clsx(
        'backdrop-blur-xs',
        testnetModeEnabled && !confirmWindow && 'mt-6 rounded-t-none',
        fullPage &&
          !confirmWindow && [
            FULL_PAGE_WRAP_OVERLAY_CLASSNAME,
            styles.fullPageOverlay,
            LAYOUT_CONTAINER_CLASSNAME,
            FULL_PAGE_LAYOUT_CONTAINER_CLASSNAME
          ]
      )}
      shouldCloseOnOverlayClick={false}
      onRequestClose={onClose}
    >
      <div className="relative p-3 pb-6 w-modal flex flex-col items-center">
        <LedgerImage
          state={imageState}
          variant={LedgerImageVariant.HalfClosed}
          className="absolute top-0 left-0 right-0"
        />
        {state !== LedgerOperationState.InProgress && (
          <Button className="absolute top-3 right-3" onClick={onClose}>
            <IconBase Icon={CloseIcon} size={16} className="text-grey-2" />
          </Button>
        )}
        <div className="w-full h-64" />
        <p className="text-font-regular-bold text-center mb-2">{title}</p>
        <span className="text-font-description text-center text-grey-1 mb-6">{description}</span>
        {icon}
      </div>
    </CustomModal>
  );
});
