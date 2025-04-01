import React from 'react';

import { TestIDProps } from 'lib/analytics';
import { TezosNetworkEssentials } from 'temple/networks';

import { SwapInputValue } from '../SwapForm.form';

export interface SwapFormInputProps extends TestIDProps {
  network: TezosNetworkEssentials;
  publicKeyHash: string;
  value: SwapInputValue;
  className?: string;
  error?: string;
  label: React.ReactNode;
  inputName: 'input' | 'output';
  readOnly?: boolean;
  onChange: (value: SwapInputValue, shouldUseFiat?: boolean) => void;
  testIDs?: SwapFormTestIDs;
  shouldUseFiat?: boolean;
  setShouldUseFiat?: SyncFn<boolean>;
}

interface SwapFormTestIDs {
  input?: string;
  assetDropDownButton?: string;
}
