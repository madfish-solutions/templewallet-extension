import React, { ChangeEvent } from 'react';

import { CurrencyInterface } from '../../exolix.interface';

export interface TopUpInputProps {
  currency: CurrencyInterface;
  currenciesList: CurrencyInterface[];
  label: React.ReactNode;
  setCurrency: (value: CurrencyInterface) => void;
  isCurrenciesLoading?: boolean;
  isSearchable?: boolean;
  amount?: number;
  className?: string;
  amountInputDisabled?: boolean;
  readOnly?: boolean;
  minAmount?: string;
  maxAmount?: string;
  isMinAmountError?: boolean;
  isMaxAmountError?: boolean;
  onAmountChange?: (value: ChangeEvent<HTMLInputElement>) => void;
}
