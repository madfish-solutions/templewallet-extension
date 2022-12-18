import { ReactNode } from 'react';

export interface CurrencyBase {
  name: string;
  code: string;
  icon: string;
  network?: {
    code: string;
    fullName: string;
    shortName?: string | null;
  };
}

export type CurrencyToken = WithRequired<CurrencyBase, 'network'>;

export type CurrencyFiat = CurrencyBase;

export interface TopUpInputPropsGeneric<C extends CurrencyBase> {
  label: ReactNode;
  amountInputDisabled?: boolean;
  readOnly?: boolean;
  minAmount?: string;
  maxAmount?: string;
  amount?: number;
  className?: string;
  isCurrenciesLoading?: boolean;
  isSearchable?: boolean;
  isMinAmountError?: boolean;
  isMaxAmountError?: boolean;
  isInsufficientTezBalanceError?: boolean;
  onAmountChange?: (value?: number) => void;
  //
  currency: C;
  currenciesList: C[];
  onCurrencySelect: (value: C) => void;
}

export type TopUpInputPropsBase = TopUpInputPropsGeneric<CurrencyBase>;
