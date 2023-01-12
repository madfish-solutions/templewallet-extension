import { ReactNode } from 'react';

export interface CurrencyBase {
  code: string;
  name?: string;
  icon?: string;
  fitIcon?: boolean;
  network?: {
    code: string;
    fullName: string;
    shortName?: string | null;
  };
}

export type CurrencyToken = WithRequired<CurrencyBase, 'network'>;

export type CurrencyFiat = Omit<CurrencyBase, 'network'>;

export interface TopUpInputPropsGeneric<C extends CurrencyBase> {
  label: ReactNode;
  currency: C;
  currenciesList: C[];
  onCurrencySelect?: (value: C) => void;
  readOnly?: boolean;
  amountInputDisabled?: boolean;
  minAmount?: string;
  maxAmount?: string;
  amount?: number;
  onAmountChange?: (value?: number) => void;
  isCurrenciesLoading?: boolean;
  isSearchable?: boolean;
  isMinAmountError?: boolean;
  isMaxAmountError?: boolean;
  isInsufficientTezBalanceError?: boolean;
  fitIcons?: boolean;
  className?: string;
}

export type TopUpInputPropsBase = TopUpInputPropsGeneric<CurrencyBase>;
