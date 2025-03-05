import React, { memo, useCallback, useMemo, useState } from 'react';

import { DerivationType } from '@taquito/ledger-signer';

import { LedgerImage } from 'app/atoms';
import { ActionsButtonsBox } from 'app/atoms/PageModal';
import { ScrollView } from 'app/atoms/PageModal/scroll-view';
import { StyledButton } from 'app/atoms/StyledButton';
import { LEDGER_USB_VENDOR_ID } from 'lib/constants';
import { T, t } from 'lib/i18n';
import { useTempleClient } from 'lib/temple/front';
import { StoredLedgerAccount, TempleAccountType } from 'lib/temple/types';
import {
  LedgerOperationState,
  LedgerUIConfigurationBase,
  isLedgerRejectionError,
  makeStateToUIConfiguration
} from 'lib/ui';
import { ZERO } from 'lib/utils/numbers';
import { TempleChainKind } from 'temple/types';

import { ConnectLedgerModalSelectors } from './selectors';
import { TezosAccountProps } from './types';
import { useGetLedgerTezosAccount } from './utils';

interface ConnectDeviceStepProps {
  onSuccess: (account: TezosAccountProps) => void;
}

const appsNames = {
  [TempleChainKind.Tezos]: 'Tezos',
  [TempleChainKind.EVM]: 'Ethereum'
};

interface UIConfiguration extends LedgerUIConfigurationBase {
  title: string | ((appName: string, modelName: string) => string);
  description: string | ((appName: string) => string);
}

const stateToUIConfiguration: Record<LedgerOperationState, UIConfiguration> =
  makeStateToUIConfiguration<UIConfiguration>({
    [LedgerOperationState.NotStarted]: {
      title: t('connectYourLedger'),
      description: appName => t('connectYourLedgerDescription', appName)
    },
    [LedgerOperationState.InProgress]: {
      title: t('lookingForDevice'),
      description: appName => t('lookingForDeviceDescription', appName)
    },
    [LedgerOperationState.Success]: {
      title: (_, modelName) => t('someLedgerConnected', modelName),
      description: t('ledgerConnectedDescription')
    },
    [LedgerOperationState.Canceled]: {
      title: t('couldNotConnect'),
      description: t('couldNotConnectDescription')
    },
    [LedgerOperationState.AppNotReady]: {
      title: appName => t('someAppIsNotReady', appName),
      description: appName => t('someAppNotReadyDescription', appName)
    },
    [LedgerOperationState.UnableToConnect]: {
      title: t('unableToConnect'),
      description: t('unableToConnectDescription')
    }
  });

const TEZOS_BY_INDEX_DERIVATION_REGEX = /^m\/44'\/1729'\/(\d+)'\/0'$/;

export const ConnectDeviceStep = memo<ConnectDeviceStepProps>(({ onSuccess }) => {
  const { accounts } = useTempleClient();
  const [tezosAccount, setTezosAccount] = useState<TezosAccountProps>({
    pkh: '',
    pk: '',
    balanceTez: ZERO,
    derivationIndex: 0,
    derivationType: DerivationType.ED25519
  });
  const [bottomEdgeIsVisible, setBottomEdgeIsVisible] = useState(true);
  const [connectionState, setConnectionState] = useState<LedgerOperationState>(LedgerOperationState.NotStarted);
  const [modelName, setModelName] = useState<string | null>(null);
  const connectionInProgress = connectionState === LedgerOperationState.InProgress;
  const connectionStarted = connectionState !== LedgerOperationState.NotStarted;
  const connectionIsSuccessful = connectionState === LedgerOperationState.Success;
  const connectionFailed = connectionStarted && !connectionIsSuccessful;
  const { imageState, title, description, icon } = stateToUIConfiguration[connectionState];
  const appName = appsNames[TempleChainKind.Tezos];

  // TODO: change the filter when importing EVM accounts is supported
  const defaultAccountIndex = useMemo(() => {
    const derivationIndexes = accounts
      .filter(
        (acc): acc is StoredLedgerAccount =>
          acc.type === TempleAccountType.Ledger &&
          (acc.derivationType ?? DerivationType.ED25519) === DerivationType.ED25519 &&
          Boolean(acc.derivationPath.match(TEZOS_BY_INDEX_DERIVATION_REGEX))
      )
      .map(account => {
        const match = account.derivationPath.match(TEZOS_BY_INDEX_DERIVATION_REGEX);

        return parseInt(match![1], 10);
      })
      .sort();
    let result = 0;
    derivationIndexes.forEach(index => {
      if (index === result) {
        result++;
      }
    });

    return result;
  }, [accounts]);
  const getLedgerTezosAccount = useGetLedgerTezosAccount();

  const connectLedger = useCallback(async () => {
    setConnectionState(LedgerOperationState.InProgress);
    try {
      const webhidTransport = window.navigator.hid;

      if (!webhidTransport) {
        setModelName(null);
        throw new Error('WebHID not supported');
      }

      const devices = await webhidTransport.getDevices();
      let webHidDevice = devices.find(device => device.vendorId === Number(LEDGER_USB_VENDOR_ID));

      if (!webHidDevice) {
        const connectedDevices = await webhidTransport.requestDevice({
          filters: [{ vendorId: LEDGER_USB_VENDOR_ID as any as number }]
        });

        webHidDevice = connectedDevices.find(device => device.vendorId === Number(LEDGER_USB_VENDOR_ID));
      }

      if (!webHidDevice) {
        setModelName(null);
        throw new Error('No Ledger connected error');
      }

      try {
        setTezosAccount(await getLedgerTezosAccount(DerivationType.ED25519, defaultAccountIndex));
        setConnectionState(LedgerOperationState.Success);
        setModelName(webHidDevice.productName);
      } catch (e: any) {
        setConnectionState(
          isLedgerRejectionError(e) ? LedgerOperationState.Canceled : LedgerOperationState.AppNotReady
        );
        setModelName(null);
      }
    } catch (err: any) {
      console.error(err);
      setConnectionState(LedgerOperationState.UnableToConnect);
      setModelName(null);
    }
  }, [defaultAccountIndex, getLedgerTezosAccount]);

  const handleContinueClick = useCallback(() => onSuccess(tezosAccount), [onSuccess, tezosAccount]);

  return (
    <>
      <ScrollView onBottomEdgeVisibilityChange={setBottomEdgeIsVisible}>
        <LedgerImage state={imageState} className="w-full" />
        <div className="flex flex-col px-4 items-center">
          <p className="text-font-regular-bold text-center mb-2">
            {typeof title === 'string' ? title : title(appName, modelName ?? '')}
          </p>
          <p className="text-font-description text-grey-1 text-center px-1 mb-6">
            {typeof description === 'string' ? description : description(appName)}
          </p>
          {icon && <div className="mb-4">{icon}</div>}
        </div>
      </ScrollView>

      <ActionsButtonsBox shouldChangeBottomShift={false} shouldCastShadow={!bottomEdgeIsVisible}>
        <StyledButton
          size="L"
          className="w-full"
          color="primary"
          disabled={connectionInProgress}
          onClick={connectionIsSuccessful ? handleContinueClick : connectLedger}
          testID={ConnectLedgerModalSelectors.connectDeviceButton}
        >
          {connectionIsSuccessful ? <T id="continue" /> : connectionFailed ? <T id="retry" /> : <T id="connect" />}
        </StyledButton>
      </ActionsButtonsBox>
    </>
  );
});
