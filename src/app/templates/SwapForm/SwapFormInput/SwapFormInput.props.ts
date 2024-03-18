import React from 'react';

import { TestIDProps } from 'lib/analytics';

import { SwapInputValue } from '../SwapForm.form';

export interface SwapFormInputProps extends TestIDProps {
  publicKeyHash: string;
  value: SwapInputValue;
  className?: string;
  error?: string;
  label: React.ReactNode;
  name: string;
  amountInputDisabled?: boolean;
  noItemsText?: string;
  onChange: (value: SwapInputValue) => void;
  testIDs?: SwapFormTestIDs;
}

interface SwapFormTestIDs {
  dropdown: string;
  input?: string;
  searchInput?: string;
  assetDropDownButton?: string;
}
