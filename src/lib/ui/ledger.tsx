import React, { ReactNode } from 'react';

import { IconBase, LedgerImageState, Loader } from 'app/atoms';
import { ReactComponent as OkFillIcon } from 'app/icons/base/ok_fill.svg';
import { ReactComponent as XCircleFillIcon } from 'app/icons/base/x_circle_fill.svg';
import { ReactComponent as WarningIcon } from 'app/icons/typed-msg/warning.svg';
import { isLedgerRejectionError } from 'lib/utils/ledger';

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
