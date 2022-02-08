import React from 'react';

import { SwapInputValue } from '../SwapForm.form';

export interface SwapFormInputProps {
  value: SwapInputValue;
  className?: string;
  error?: string;
  label: React.ReactNode;
  name: string;
  amountInputDisabled?: boolean;
  onChange: (value: SwapInputValue) => void;
  onAmountChange: (value: SwapInputValue['amount']) => void;
}
