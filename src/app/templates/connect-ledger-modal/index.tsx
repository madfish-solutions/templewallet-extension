import React, { memo, useCallback, useState } from 'react';

import { CLOSE_ANIMATION_TIMEOUT, PageModal } from 'app/atoms/PageModal';
import { toastSuccess } from 'app/toaster';
import { IS_FIREFOX } from 'lib/env';
import { t } from 'lib/i18n';

import { ConnectDeviceStep } from './connect-device-step';
import { FirefoxRestrictionStep } from './firefox-restriction-step';
import { SelectAccountStep } from './select-account-step';
import { SelectNetworkStep } from './select-network-step';
import { AccountProps, LedgerConnectionConfig } from './types';

interface ConnectLedgerModalProps {
  animated?: boolean;
  shouldShowBackButton?: boolean;
  onStartGoBack?: EmptyFn;
  onClose: EmptyFn;
}

enum ConnectLedgerModalStep {
  FirefoxRestriction = 'FirefoxRestriction',
  SelectNetwork = 'SelectNetwork',
  ConnectDevice = 'ConnectDevice',
  SelectAccount = 'SelectAccount'
}

interface FirefoxRestrictionState {
  step: ConnectLedgerModalStep.FirefoxRestriction;
}

interface SelectNetworkState {
  step: ConnectLedgerModalStep.SelectNetwork;
  selection?: LedgerConnectionConfig;
}

interface ConnectDeviceState {
  step: ConnectLedgerModalStep.ConnectDevice;
  selection: LedgerConnectionConfig;
}

interface SelectAccountState {
  step: ConnectLedgerModalStep.SelectAccount;
  initialAccount: AccountProps;
  selection: LedgerConnectionConfig;
}

type State = FirefoxRestrictionState | SelectNetworkState | ConnectDeviceState | SelectAccountState;

export const ConnectLedgerModal = memo<ConnectLedgerModalProps>(
  ({ animated = true, shouldShowBackButton, onStartGoBack, onClose }) => {
    const [state, setState] = useState<State>({
      step: IS_FIREFOX ? ConnectLedgerModalStep.FirefoxRestriction : ConnectLedgerModalStep.SelectNetwork
    });
    const isFirstStep =
      state.step === ConnectLedgerModalStep.SelectNetwork || state.step === ConnectLedgerModalStep.FirefoxRestriction;

    const goStepBack = useCallback(
      () =>
        setState(prevState => {
          switch (prevState.step) {
            case ConnectLedgerModalStep.ConnectDevice:
              return { step: ConnectLedgerModalStep.SelectNetwork, selection: prevState.selection };
            case ConnectLedgerModalStep.SelectAccount:
              return { step: ConnectLedgerModalStep.ConnectDevice, selection: prevState.selection };
            default:
              return prevState;
          }
        }),
      []
    );

    const goToConnectDevice = useCallback((selection: LedgerConnectionConfig) => {
      setState({ step: ConnectLedgerModalStep.ConnectDevice, selection });
    }, []);
    const goToSelectAccount = useCallback(
      (initialAccount: AccountProps, selection: LedgerConnectionConfig) =>
        setState({ step: ConnectLedgerModalStep.SelectAccount, initialAccount, selection }),
      []
    );
    const handleImportSuccess = useCallback(() => {
      setTimeout(() => toastSuccess(t('ledgerImportSuccessToast')), CLOSE_ANIMATION_TIMEOUT * 2);
      onClose();
    }, [onClose]);

    return (
      <PageModal
        title={t(state.step === ConnectLedgerModalStep.SelectAccount ? 'selectAccount' : 'ledgerConnect')}
        animated={animated}
        opened
        onGoBack={shouldShowBackButton && isFirstStep ? onStartGoBack : isFirstStep ? undefined : goStepBack}
        onRequestClose={onClose}
      >
        {state.step === ConnectLedgerModalStep.FirefoxRestriction && <FirefoxRestrictionStep onClose={onClose} />}
        {state.step === ConnectLedgerModalStep.SelectNetwork && (
          <SelectNetworkStep onSelect={goToConnectDevice} initialSelection={state.selection} />
        )}
        {state.step === ConnectLedgerModalStep.ConnectDevice && (
          <ConnectDeviceStep
            selection={state.selection}
            onSuccess={account => goToSelectAccount(account, state.selection)}
          />
        )}
        {state.step === ConnectLedgerModalStep.SelectAccount && (
          <SelectAccountStep
            initialAccount={state.initialAccount}
            selection={state.selection}
            onSuccess={handleImportSuccess}
          />
        )}
      </PageModal>
    );
  }
);
