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
  name: string;
  amountInputDisabled?: boolean;
  onChange: (value: SwapInputValue, shouldUseFiat?: boolean) => void;
  testIDs?: SwapFormTestIDs;
  shouldUseFiat?: boolean;
  setShouldUseFiat?: (value: boolean) => void;
}

interface SwapFormTestIDs {
  input?: string;
  assetDropDownButton?: string;
}
