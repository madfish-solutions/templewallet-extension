import type { Transaction, BlockTransactionWithContractTransfers } from '@covalenthq/client-sdk';

import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { getEvmAddressSafe } from 'lib/utils/evm.utils';

import { ActivityOperKindEnum, EvmActivityAsset, EvmOperation } from '../../types';

export function parseGasTransfer(
  item: Transaction | BlockTransactionWithContractTransfers,
  accountAddress: string,
  /** Only way to suspect transfering to a contract, not an account */
  partOfBatch: boolean
): EvmOperation | null {
  const value: string = item.value?.toString() ?? '0';

  if (value === '0' && partOfBatch) return null;

  const kind = (() => {
    if (getEvmAddressSafe(item.from_address) === accountAddress)
      return partOfBatch ? ActivityOperKindEnum.transferFrom : ActivityOperKindEnum.transferFrom_ToAccount;
    if (getEvmAddressSafe(item.to_address) === accountAddress)
      return partOfBatch ? ActivityOperKindEnum.transferTo : ActivityOperKindEnum.transferTo_FromAccount;

    return null;
  })();

  if (!kind) return null;

  const decimals = item.gas_metadata?.contract_decimals;

  const amountSigned = kind === ActivityOperKindEnum.transferFrom_ToAccount ? `-${value}` : value;

  const symbol = item.gas_metadata?.contract_ticker_symbol;

  const asset: EvmActivityAsset = {
    contract: EVM_TOKEN_SLUG,
    amountSigned,
    decimals,
    symbol
  };

  return { kind, asset };
}
