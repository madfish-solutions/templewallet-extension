import React, { memo, useCallback, useState } from 'react';

import { BackButton, PageModal } from 'app/atoms/PageModal';
import { t } from 'lib/i18n';
import { TempleChainKind } from 'temple/types';

import { ConnectDeviceStep } from './connect-device-step';
import { SelectAccountStep } from './select-account-step';
import { SelectNetworkStep } from './select-network-step';
<<<<<<< HEAD
import { AccountProps } from './types';
=======
import { TezosAccountProps } from './types';
>>>>>>> 4c37aa5da56960c040a4ae451447acc11e278d33

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
<<<<<<< HEAD
  chainKind: TempleChainKind;
=======
  // TODO: add a property for chain kind
>>>>>>> 4c37aa5da56960c040a4ae451447acc11e278d33
}

interface SelectAccountState {
  step: ConnectLedgerModalStep.SelectAccount;
<<<<<<< HEAD
  initialAccount: AccountProps;
=======
  initialAccount: TezosAccountProps;
>>>>>>> 4c37aa5da56960c040a4ae451447acc11e278d33
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
<<<<<<< HEAD
              return { step: ConnectLedgerModalStep.ConnectDevice, chainKind: prevState.initialAccount.chain };
=======
              return { step: ConnectLedgerModalStep.ConnectDevice };
>>>>>>> 4c37aa5da56960c040a4ae451447acc11e278d33
            default:
              return prevState;
          }
        }),
      []
    );

    const goToConnectDevice = useCallback((chainKind: TempleChainKind) => {
<<<<<<< HEAD
      setState({ step: ConnectLedgerModalStep.ConnectDevice, chainKind });
    }, []);
    const goToSelectAccount = useCallback(
      (initialAccount: AccountProps) => setState({ step: ConnectLedgerModalStep.SelectAccount, initialAccount }),
=======
      // TODO: do the same for EVM
      if (chainKind === TempleChainKind.Tezos) {
        setState({ step: ConnectLedgerModalStep.ConnectDevice });
      }
    }, []);
    const goToSelectAccount = useCallback(
      (initialAccount: TezosAccountProps) => setState({ step: ConnectLedgerModalStep.SelectAccount, initialAccount }),
>>>>>>> 4c37aa5da56960c040a4ae451447acc11e278d33
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
<<<<<<< HEAD
        {state.step === ConnectLedgerModalStep.ConnectDevice && (
          <ConnectDeviceStep chainKind={state.chainKind} onSuccess={goToSelectAccount} />
        )}
=======
        {state.step === ConnectLedgerModalStep.ConnectDevice && <ConnectDeviceStep onSuccess={goToSelectAccount} />}
>>>>>>> 4c37aa5da56960c040a4ae451447acc11e278d33
        {state.step === ConnectLedgerModalStep.SelectAccount && (
          <SelectAccountStep initialAccount={state.initialAccount} onSuccess={onClose} />
        )}
      </PageModal>
    );
  }
);
