import { TezosNetworkEssentials } from 'temple/networks';

export interface TransactionFormData {
  amount: string;
  to: string;
}

export interface TransactionFormDataWithMemo extends TransactionFormData {
  memo: string;
}

export interface TransactionFormProps {
  accountId: string;
  network: TezosNetworkEssentials;
  sender: string;
  saplingContractAddress: string;
}
