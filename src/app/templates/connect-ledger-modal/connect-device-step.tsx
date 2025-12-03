import React, { memo, useCallback, useState } from 'react';

import { DerivationType } from '@taquito/ledger-signer';

import { FadeTransition } from 'app/a11y/FadeTransition';
import { LedgerImage } from 'app/atoms';
import { StyledButton } from 'app/atoms/StyledButton';
import { LEDGER_USB_VENDOR_ID } from 'lib/constants';
import { T, t } from 'lib/i18n';
import { LedgerOperationState, LedgerUIConfigurationBase, makeStateToUIConfiguration } from 'lib/ui';
import { isLedgerRejectionError } from 'lib/utils/ledger';
import { TempleChainKind } from 'temple/types';

import { PageModalScrollViewWithActions } from '../page-modal-scroll-view-with-actions';

import { ConnectLedgerModalSelectors } from './selectors';
import { AccountProps, LedgerConnectionConfig } from './types';
import { useGetLedgerEvmAccount, useGetLedgerTezosAccount } from './utils';

interface ConnectDeviceStepProps {
  onSuccess: (account: AccountProps) => void;
  selection: LedgerConnectionConfig;
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
      description: t('couldNotConnectLedgerDescription')
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

const parseIndexOrPath = (raw?: string): string | number => {
  if (!raw) return 0;

  const trimmedValue = raw.trim();

  if (!trimmedValue) {
    return 0;
  }

  if (trimmedValue.includes('/')) {
    return trimmedValue;
  }

  const parsedNumber = Number(trimmedValue);

  return Number.isFinite(parsedNumber) ? parsedNumber : 0;
};

export const ConnectDeviceStep = memo<ConnectDeviceStepProps>(({ selection, onSuccess }) => {
  const { chainKind, tezosSettings } = selection;
  const [account, setAccount] = useState<AccountProps>();
  const [connectionState, setConnectionState] = useState<LedgerOperationState>(LedgerOperationState.NotStarted);
  const [modelName, setModelName] = useState<string | null>(null);
  const connectionInProgress = connectionState === LedgerOperationState.InProgress;
  const connectionStarted = connectionState !== LedgerOperationState.NotStarted;
  const connectionIsSuccessful = connectionState === LedgerOperationState.Success;
  const connectionFailed = connectionStarted && !connectionIsSuccessful;
  const { imageState, title, description, icon } = stateToUIConfiguration[connectionState];
  const appName = appsNames[chainKind];

  const getLedgerTezosAccount = useGetLedgerTezosAccount();
  const getLedgerEvmAccount = useGetLedgerEvmAccount();

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
        setAccount(
          chainKind === TempleChainKind.Tezos
            ? await getLedgerTezosAccount(
                tezosSettings?.derivationType ?? DerivationType.ED25519,
                tezosSettings?.indexOrDerivationPath ? parseIndexOrPath(tezosSettings.indexOrDerivationPath) : 0
              )
            : await getLedgerEvmAccount(0)
        );
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
  }, [chainKind, getLedgerEvmAccount, getLedgerTezosAccount, tezosSettings]);

  const handleContinueClick = useCallback(() => onSuccess(account!), [onSuccess, account]);

  return (
    <FadeTransition>
      <PageModalScrollViewWithActions
        actionsBoxProps={{
          shouldChangeBottomShift: false,
          children: (
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
          )
        }}
      >
        <LedgerImage state={imageState} chainKind={chainKind} className="w-full" />
        <div className="flex flex-col px-4 items-center">
          <p className="text-font-regular-bold text-center mb-2">
            {typeof title === 'string' ? title : title(appName, modelName ?? '')}
          </p>
          <p className="text-font-description text-grey-1 text-center px-1 mb-6">
            {typeof description === 'string' ? description : description(appName)}
          </p>
          {icon && <div className="mb-4">{icon}</div>}
        </div>
      </PageModalScrollViewWithActions>
    </FadeTransition>
  );
});
