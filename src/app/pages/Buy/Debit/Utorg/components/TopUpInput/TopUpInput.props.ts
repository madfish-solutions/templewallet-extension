import React, { ChangeEvent } from 'react';

export interface TopUpInputProps {
  currencyName: string;
  currenciesList: string[];
  label: React.ReactNode;
  setCurrencyName?: (value: string) => void;
  isCurrenciesLoading?: boolean;
  isSearchable?: boolean;
  amount?: number;
  className?: string;
  singleToken?: boolean;
  amountInputDisabled?: boolean;
  readOnly?: boolean;
  minAmount?: string;
  maxAmount?: string;
  isMinAmountError?: boolean;
  isMaxAmountError?: boolean;
  onAmountChange?: (value: ChangeEvent<HTMLInputElement>) => void;
}
