import type { BlockTransactionWithContractTransfers, TokenTransferItem } from '@covalenthq/client-sdk';

import { getEvmAddressSafe } from 'lib/utils/evm.utils';
import { TempleChainKind } from 'temple/types';

import {
  ActivityOperKindEnum,
  ActivityOperTransferType,
  ActivityStatus,
  EvmActivity,
  EvmActivityAsset,
  EvmOperation
} from '../../types';

import { parseGasTransfer } from './gas';

export function parseGoldRushERC20Transfer(
  item: BlockTransactionWithContractTransfers,
  chainId: number,
  accountAddress: string
): EvmActivity {
  const transfers = item.transfers ?? [];
  const addedAt = item.block_signed_at as unknown as string;

  const operations = transfers.map(transfer => parseTransfer(transfer, item));

  const gasOperation = parseGasTransfer(item, accountAddress, Boolean(transfers.length));

  if (gasOperation) operations.unshift(gasOperation);

  return {
    chain: TempleChainKind.EVM,
    chainId,
    hash: item.tx_hash!,
    blockExplorerUrl: item.transfers?.[0].explorers?.[0]?.url,
    operations,
    operationsCount: gasOperation ? transfers.length + 1 : transfers.length,
    addedAt,
    status: item.successful ? ActivityStatus.applied : ActivityStatus.failed
  };
}

function parseTransfer(transfer: TokenTransferItem, item: BlockTransactionWithContractTransfers): EvmOperation {
  const fromAddress = getEvmAddressSafe(transfer.from_address)!;
  const toAddress = getEvmAddressSafe(transfer.to_address)!;

  const type: ActivityOperTransferType = (() => {
    if (transfer.transfer_type === 'IN') {
      if (item.to_address === transfer.contract_address) return ActivityOperTransferType.receiveFromAccount;

      return ActivityOperTransferType.receive;
    }

    if (item.to_address === transfer.contract_address) return ActivityOperTransferType.sendToAccount;

    return ActivityOperTransferType.send;
  })();

  const operBase = { kind: ActivityOperKindEnum.transfer as const, type, fromAddress, toAddress };

  const contractAddress = getEvmAddressSafe(transfer.contract_address);

  if (contractAddress == null) return operBase;

  const decimals = transfer.contract_decimals ?? undefined;

  const nft = false;
  const amount = nft ? '1' : transfer.delta?.toString() ?? '0';
  const symbol = transfer.contract_ticker_symbol || undefined;

  const amountSigned =
    type === ActivityOperTransferType.send || type === ActivityOperTransferType.sendToAccount ? `-${amount}` : amount;

  const asset: EvmActivityAsset = {
    contract: contractAddress,
    amountSigned,
    decimals,
    symbol,
    nft,
    iconURL: transfer.logo_url ?? undefined
  };

  return { ...operBase, asset };
}
