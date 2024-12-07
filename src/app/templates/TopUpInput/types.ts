import { ReactNode } from 'react';

import { TestIDProperty } from 'lib/analytics';

export interface CurrencyBase {
  code: string;
  codeToDisplay?: string;
  name?: string;
  icon?: string;
  fitIcon?: boolean;
  network?: {
    code: string;
    fullName: string;
    shortName?: string | null;
  };
}

export interface TopUpInputPropsGeneric<C extends CurrencyBase> extends TestIDProperty {
  label: ReactNode;
  isFiat?: boolean;
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
  fitIcons?: boolean | ((currency: C) => boolean);
  className?: string;
  decimals?: number;
  emptyListPlaceholder?: string;
}

export type TopUpInputPropsBase = TopUpInputPropsGeneric<CurrencyBase>;
