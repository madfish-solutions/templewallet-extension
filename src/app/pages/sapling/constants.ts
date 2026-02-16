import { TransactionFormData, TransactionFormDataWithMemo } from './types';

export const DEFAULT_TRANSACTION_FORM_VALUES: TransactionFormData = {
  amount: '',
  to: ''
};

export const DEFAULT_TRANSACTION_FORM_VALUES_WITH_MEMO: TransactionFormDataWithMemo = {
  amount: '',
  to: '',
  memo: ''
};
