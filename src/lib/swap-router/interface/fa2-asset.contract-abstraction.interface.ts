import { ContractAbstraction, ContractProvider, ContractMethod } from '@taquito/taquito';
import { BigNumber } from 'bignumber.js';

interface AddOperator {
  owner: string;
  operator: string;
  token_id: string;
}

interface RemoveOperator {
  owner: string;
  operator: string;
  token_id: string;
}

type UpdateOperatorsItem = { add_operator: AddOperator } | { remove_operator: RemoveOperator };

interface TxsItem {
  to_: string;
  token_id: string;
  amount: BigNumber;
}

interface TransferItem {
  from_: string;
  txs: TxsItem[];
}

export interface Fa2AssetContractAbstraction extends ContractAbstraction<ContractProvider> {
  methods: {
    update_operators: (updateOperators: UpdateOperatorsItem[]) => ContractMethod<ContractProvider>;
    transfer: (transferItems: TransferItem[]) => ContractMethod<ContractProvider>;
  };
}
