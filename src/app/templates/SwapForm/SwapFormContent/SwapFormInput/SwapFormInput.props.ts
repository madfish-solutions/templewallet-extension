import React from 'react';

import { SwapInputValue } from '../SwapFormValue.interface';

export interface SwapFormInputProps {
  value: SwapInputValue;
  className?: string;
  error?: string;
  label: React.ReactNode;
  name: string;
  triggerValidation: (payload?: string | string[] | undefined, shouldRender?: boolean | undefined) => void;
  withPercentageButtons?: boolean;
  isOutput?: boolean;
  onChange: (value: SwapInputValue) => void;
  onAmountChange: (value: SwapInputValue['amount']) => void;
}
