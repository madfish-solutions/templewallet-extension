import { GoldRushERC20Transaction, GoldRushERC20TransactionTransfer } from 'lib/apis/temple/endpoints/evm';
import { getEvmAddressSafe } from 'lib/utils/evm.utils';
import { TempleChainKind } from 'temple/types';

import { ActivityOperKindEnum, EvmActivity, EvmActivityAsset, EvmOperation } from '../../types';

import { parseGasTransfer } from './gas';

export function parseGoldRushERC20Transfer(
  item: GoldRushERC20Transaction,
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
    addedAt
  };
}

function parseTransfer(transfer: GoldRushERC20TransactionTransfer, item: GoldRushERC20Transaction): EvmOperation {
  const kind = (() => {
    if (transfer.transfer_type === 'IN') {
      return item.to_address === transfer.contract_address
        ? ActivityOperKindEnum.transferTo_FromAccount
        : ActivityOperKindEnum.transferTo;
    }

    return item.to_address === transfer.contract_address
      ? ActivityOperKindEnum.transferFrom_ToAccount
      : ActivityOperKindEnum.transferFrom;
  })();

  const contractAddress = getEvmAddressSafe(transfer.contract_address);

  if (contractAddress == null) return { kind };

  const decimals = transfer.contract_decimals ?? undefined;

  const nft = false;
  const amount = nft ? '1' : transfer.delta?.toString() ?? '0';
  const symbol = transfer.contract_ticker_symbol || undefined;

  const amountSigned =
    kind === ActivityOperKindEnum.transferFrom || kind === ActivityOperKindEnum.transferFrom_ToAccount
      ? `-${amount}`
      : amount;

  const asset: EvmActivityAsset = {
    contract: contractAddress,
    amountSigned,
    decimals,
    symbol,
    nft,
    iconURL: transfer.logo_url ?? undefined
  };

  return { kind, asset };
}
