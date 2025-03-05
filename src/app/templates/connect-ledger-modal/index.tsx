import React, { memo, useCallback, useState } from 'react';

import { BackButton, PageModal } from 'app/atoms/PageModal';
import { t } from 'lib/i18n';
import { TempleChainKind } from 'temple/types';

import { ConnectDeviceStep } from './connect-device-step';
import { SelectAccountStep } from './select-account-step';
import { SelectNetworkStep } from './select-network-step';
import { TezosAccountProps } from './types';

interface ConnectLedgerModalProps {
  animated?: boolean;
  shouldShowBackButton?: boolean;
  onStartGoBack?: EmptyFn;
  onClose: EmptyFn;
}

enum ConnectLedgerModalStep {
  SelectNetwork = 'SelectNetwork',
  ConnectDevice = 'ConnectDevice',
  SelectAccount = 'SelectAccount'
}

interface SelectNetworkState {
  step: ConnectLedgerModalStep.SelectNetwork;
}

interface ConnectDeviceState {
  step: ConnectLedgerModalStep.ConnectDevice;
  // TODO: add a property for chain kind
}

interface SelectAccountState {
  step: ConnectLedgerModalStep.SelectAccount;
  initialAccount: TezosAccountProps;
}

type State = SelectNetworkState | ConnectDeviceState | SelectAccountState;

export const ConnectLedgerModal = memo<ConnectLedgerModalProps>(
  ({ animated = true, shouldShowBackButton, onStartGoBack, onClose }) => {
    const [state, setState] = useState<State>({ step: ConnectLedgerModalStep.SelectNetwork });
    const isFirstStep = state.step === ConnectLedgerModalStep.SelectNetwork;

    const goStepBack = useCallback(
      () =>
        setState(prevState => {
          switch (prevState.step) {
            case ConnectLedgerModalStep.ConnectDevice:
              return { step: ConnectLedgerModalStep.SelectNetwork };
            case ConnectLedgerModalStep.SelectAccount:
              return { step: ConnectLedgerModalStep.ConnectDevice };
            default:
              return prevState;
          }
        }),
      []
    );

    const goToConnectDevice = useCallback((chainKind: TempleChainKind) => {
      // TODO: do the same for EVM
      if (chainKind === TempleChainKind.Tezos) {
        setState({ step: ConnectLedgerModalStep.ConnectDevice });
      }
    }, []);
    const goToSelectAccount = useCallback(
      (initialAccount: TezosAccountProps) => setState({ step: ConnectLedgerModalStep.SelectAccount, initialAccount }),
      []
    );

    return (
      <PageModal
        title={t(state.step === ConnectLedgerModalStep.SelectAccount ? 'connectAccount' : 'ledgerConnect')}
        animated={animated}
        opened
        titleLeft={
          (shouldShowBackButton && isFirstStep) || !isFirstStep ? (
            <BackButton onClick={isFirstStep ? onStartGoBack : goStepBack} />
          ) : null
        }
        onRequestClose={onClose}
      >
        {state.step === ConnectLedgerModalStep.SelectNetwork && <SelectNetworkStep onSelect={goToConnectDevice} />}
        {state.step === ConnectLedgerModalStep.ConnectDevice && <ConnectDeviceStep onSuccess={goToSelectAccount} />}
        {state.step === ConnectLedgerModalStep.SelectAccount && (
          <SelectAccountStep initialAccount={state.initialAccount} onSuccess={onClose} />
        )}
      </PageModal>
    );
  }
);
