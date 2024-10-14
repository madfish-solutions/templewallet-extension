import type { Transaction, BlockTransactionWithContractTransfers } from '@covalenthq/client-sdk';

import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { getEvmAddressSafe } from 'lib/utils/evm.utils';

import { ActivityOperKindEnum, ActivityOperTransferType, EvmActivityAsset, EvmOperation } from '../../types';

export function parseGasTransfer(
  item: Transaction | BlockTransactionWithContractTransfers,
  accountAddress: string,
  /** Only way to suspect transfering to a contract, not an account */
  partOfBatch: boolean
): EvmOperation | null {
  const value: string = item.value?.toString() ?? '0';

  if (value === '0' && partOfBatch) return null;

  const fromAddress = getEvmAddressSafe(item.from_address)!;
  const toAddress = getEvmAddressSafe(item.to_address)!;

  const type = (() => {
    if (fromAddress === accountAddress)
      return partOfBatch ? ActivityOperTransferType.fromUs : ActivityOperTransferType.fromUsToAccount;
    if (toAddress === accountAddress)
      return partOfBatch ? ActivityOperTransferType.toUs : ActivityOperTransferType.toUsFromAccount;

    return null;
  })();

  if (type == null) return null;

  const kind = ActivityOperKindEnum.transfer;

  const decimals = item.gas_metadata?.contract_decimals;

  const amountSigned =
    type === ActivityOperTransferType.fromUs || type === ActivityOperTransferType.fromUsToAccount ? `-${value}` : value;

  const symbol = item.gas_metadata?.contract_ticker_symbol;

  const asset: EvmActivityAsset = {
    contract: EVM_TOKEN_SLUG,
    amountSigned,
    decimals,
    symbol
  };

  return { kind, type, fromAddress, toAddress, asset };
}
