import React from 'react';

import { TestIDProps } from '../../../../lib/analytics';
import { SwapInputValue } from '../SwapForm.form';

export interface SwapFormInputProps extends TestIDProps {
  value: SwapInputValue;
  className?: string;
  error?: string;
  label: React.ReactNode;
  name: string;
  amountInputDisabled?: boolean;
  onChange: (value: SwapInputValue) => void;
  testIDs?: SwapFormTestIDs;
}

export interface SwapFormTestIDs {
  input?: string;
  searchInput?: string;
  assetSelector?: string;
}
