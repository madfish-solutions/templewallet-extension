import React, { memo, useCallback, useState } from 'react';

import { CLOSE_ANIMATION_TIMEOUT, PageModal } from 'app/atoms/PageModal';
import { toastSuccess } from 'app/toaster';
import { IS_FIREFOX } from 'lib/env';
import { t } from 'lib/i18n';
import { TempleChainKind } from 'temple/types';

import { ConnectDeviceStep } from './connect-device-step';
import { FirefoxRestrictionStep } from './firefox-restriction-step';
import { SelectAccountStep } from './select-account-step';
import { SelectNetworkStep } from './select-network-step';
import { AccountProps } from './types';

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
}

interface ConnectDeviceState {
  step: ConnectLedgerModalStep.ConnectDevice;
  chainKind: TempleChainKind;
}

interface SelectAccountState {
  step: ConnectLedgerModalStep.SelectAccount;
  initialAccount: AccountProps;
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
              return { step: ConnectLedgerModalStep.SelectNetwork };
            case ConnectLedgerModalStep.SelectAccount:
              return { step: ConnectLedgerModalStep.ConnectDevice, chainKind: prevState.initialAccount.chain };
            default:
              return prevState;
          }
        }),
      []
    );

    const goToConnectDevice = useCallback((chainKind: TempleChainKind) => {
      setState({ step: ConnectLedgerModalStep.ConnectDevice, chainKind });
    }, []);
    const goToSelectAccount = useCallback(
      (initialAccount: AccountProps) => setState({ step: ConnectLedgerModalStep.SelectAccount, initialAccount }),
      []
    );
    const handleImportSuccess = useCallback(() => {
      setTimeout(() => toastSuccess(t('ledgerImportSuccessToast')), CLOSE_ANIMATION_TIMEOUT * 2);
      onClose();
    }, [onClose]);

    return (
      <PageModal
        title={t(state.step === ConnectLedgerModalStep.SelectAccount ? 'connectAccount' : 'ledgerConnect')}
        animated={animated}
        opened
        onGoBack={shouldShowBackButton && isFirstStep ? onStartGoBack : isFirstStep ? undefined : goStepBack}
        onRequestClose={onClose}
      >
        {state.step === ConnectLedgerModalStep.FirefoxRestriction && <FirefoxRestrictionStep onClose={onClose} />}
        {state.step === ConnectLedgerModalStep.SelectNetwork && <SelectNetworkStep onSelect={goToConnectDevice} />}
        {state.step === ConnectLedgerModalStep.ConnectDevice && (
          <ConnectDeviceStep chainKind={state.chainKind} onSuccess={goToSelectAccount} />
        )}
        {state.step === ConnectLedgerModalStep.SelectAccount && (
          <SelectAccountStep initialAccount={state.initialAccount} onSuccess={handleImportSuccess} />
        )}
      </PageModal>
    );
  }
);
