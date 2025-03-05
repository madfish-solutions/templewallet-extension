import React, { ReactNode } from 'react';

import { IconBase, LedgerImageState, Loader } from 'app/atoms';
import { ReactComponent as OkFillIcon } from 'app/icons/base/ok_fill.svg';
import { ReactComponent as XCircleFillIcon } from 'app/icons/base/x_circle_fill.svg';
import { ReactComponent as WarningIcon } from 'app/icons/typed-msg/warning.svg';

export interface LedgerUIConfigurationBase {
  imageState: LedgerImageState;
  icon?: ReactNode;
}

export enum LedgerOperationState {
  NotStarted = 'NotStarted',
  InProgress = 'InProgress',
  Canceled = 'Canceled',
  AppNotReady = 'AppNotReady',
  UnableToConnect = 'UnableToConnect',
  Success = 'Success'
}

const stateToUIConfigurationBase: Record<LedgerOperationState, LedgerUIConfigurationBase> = {
  [LedgerOperationState.NotStarted]: {
    imageState: LedgerImageState.Connect
  },
  [LedgerOperationState.InProgress]: {
    imageState: LedgerImageState.Looking,
    icon: <Loader size="L" trackVariant="dark" className="text-secondary" />
  },
  [LedgerOperationState.Success]: {
    imageState: LedgerImageState.Success,
    icon: <IconBase size={24} className="text-success" Icon={OkFillIcon} />
  },
  [LedgerOperationState.Canceled]: {
    imageState: LedgerImageState.Fail,
    icon: <IconBase size={24} className="text-error" Icon={XCircleFillIcon} />
  },
  [LedgerOperationState.AppNotReady]: {
    imageState: LedgerImageState.Fail,
    icon: <IconBase size={24} className="text-error" Icon={XCircleFillIcon} />
  },
  [LedgerOperationState.UnableToConnect]: {
    imageState: LedgerImageState.FailYellow,
    icon: <WarningIcon className="w-6 h-auto" />
  }
};

export const makeStateToUIConfiguration = <T extends LedgerUIConfigurationBase>(
  complements: Record<LedgerOperationState, Omit<T, 'imageState' | 'icon'>>
) =>
  Object.entries(stateToUIConfigurationBase).reduce((acc, [key, value]) => {
    // @ts-expect-error
    acc[key] = { ...value, ...complements[key] };
    return acc;
  }, {} as Record<LedgerOperationState, T>);

const LEDGER_ERROR_CODE_REGEX = /\((0x[0-9a-f]+)\)/i;
const LEDGER_APP_REJECTED_ERROR_CODE = 0x6985;
const LEDGER_LOCKED_ERROR_CODE = 0x5515;
const getLedgerErrorCode = (error: Error) => {
  const match = error.message.match(LEDGER_ERROR_CODE_REGEX);

  return match ? parseInt(match[1], 16) : null;
};

export const isLedgerRejectionError = (error: Error) => {
  const errorCode = getLedgerErrorCode(error);

  return [LEDGER_APP_REJECTED_ERROR_CODE, LEDGER_LOCKED_ERROR_CODE].some(
    couldNotConnectErrorCode => errorCode === couldNotConnectErrorCode
  );
};

export const runConnectedLedgerOperationFlow = async (
  action: () => Promise<void>,
  setOperationState: (state: LedgerOperationState) => void,
  throwError?: boolean
) => {
  try {
    setOperationState(LedgerOperationState.InProgress);
    await action();
    setOperationState(LedgerOperationState.Success);
  } catch (e: any) {
    setOperationState(isLedgerRejectionError(e) ? LedgerOperationState.Canceled : LedgerOperationState.UnableToConnect);

    if (throwError) {
      throw e;
    }
  }
};
