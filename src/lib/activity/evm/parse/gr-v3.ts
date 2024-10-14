import type { Transaction, LogEvent } from '@covalenthq/client-sdk';

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

export function parseGoldRushTransaction(item: Transaction, chainId: number, accountAddress: string): EvmActivity {
  const logEvents = item.log_events ?? [];
  const addedAt = item.block_signed_at as unknown as string;

  const operations = logEvents.map(logEvent => parseLogEvent(logEvent, item, accountAddress));

  const gasOperation = parseGasTransfer(item, accountAddress, Boolean(logEvents.length));

  if (gasOperation) operations.unshift(gasOperation);

  return {
    chain: TempleChainKind.EVM,
    chainId,
    hash: item.tx_hash!,
    blockExplorerUrl: item.explorers?.at(0)?.url,
    operations,
    operationsCount: gasOperation ? logEvents.length + 1 : logEvents.length,
    addedAt,
    status: item.successful ? ActivityStatus.applied : ActivityStatus.failed
  };
}

function parseLogEvent(logEvent: LogEvent, item: Transaction, accountAddress: string): EvmOperation {
  const contractAddress = getEvmAddressSafe(logEvent.sender_address) ?? undefined;

  if (!logEvent.decoded?.params) return { kind: ActivityOperKindEnum.interaction, withAddress: contractAddress };

  const decimals = logEvent.sender_contract_decimals ?? undefined;
  const symbol = logEvent.sender_contract_ticker_symbol || undefined;
  const iconURL = logEvent.sender_logo_url ?? undefined;

  if (logEvent.decoded.name === 'Transfer') {
    const fromAddress = getEvmAddressSafe(logEvent.decoded.params.at(0)?.value)!;
    const toAddress = getEvmAddressSafe(logEvent.decoded.params.at(1)?.value)!;

    const type = (() => {
      if (toAddress === accountAddress) {
        return item.to_address === logEvent.sender_address
          ? ActivityOperTransferType.toUsFromAccount
          : ActivityOperTransferType.toUs;
      }

      if (fromAddress === accountAddress) {
        return item.to_address === logEvent.sender_address
          ? ActivityOperTransferType.fromUsToAccount
          : ActivityOperTransferType.fromUs;
      }

      return null;
    })();

    if (type == null) return { kind: ActivityOperKindEnum.interaction, withAddress: contractAddress };

    const kind = ActivityOperKindEnum.transfer;

    if (!contractAddress) return { kind, type, fromAddress, toAddress };

    const param3 = logEvent.decoded.params.at(2);
    const amountOrTokenId: string = param3?.value ?? '0';
    const nft = param3?.indexed ?? false;
    const tokenId = nft ? amountOrTokenId : undefined;

    const amount = nft ? '1' : amountOrTokenId;

    const amountSigned =
      type === ActivityOperTransferType.fromUs || type === ActivityOperTransferType.fromUsToAccount
        ? `-${amount}`
        : amount;

    const asset: EvmActivityAsset = {
      contract: contractAddress,
      tokenId,
      amountSigned,
      decimals,
      symbol,
      nft,
      iconURL
    };

    return { kind, type, fromAddress, toAddress, asset };
  }

  if (logEvent.decoded.name === 'TransferSingle') {
    const fromAddress = getEvmAddressSafe(logEvent.decoded.params.at(1)?.value)!;
    const toAddress = getEvmAddressSafe(logEvent.decoded.params.at(2)?.value)!;

    const type = (() => {
      if (toAddress === accountAddress) {
        return item.to_address === logEvent.sender_address
          ? ActivityOperTransferType.toUsFromAccount
          : ActivityOperTransferType.toUs;
      }

      if (fromAddress === accountAddress) {
        return item.to_address === logEvent.sender_address
          ? ActivityOperTransferType.fromUsToAccount
          : ActivityOperTransferType.fromUs;
      }

      return null;
    })();

    if (type == null) return { kind: ActivityOperKindEnum.interaction, withAddress: contractAddress };

    const kind = ActivityOperKindEnum.transfer;

    if (!contractAddress) return { kind, type, fromAddress, toAddress };

    const tokenId = logEvent.decoded.params.at(3)?.value ?? '0';

    const amount = '1';

    const amountSigned =
      type === ActivityOperTransferType.fromUs || type === ActivityOperTransferType.fromUsToAccount
        ? `-${amount}`
        : amount;

    const asset: EvmActivityAsset = {
      contract: contractAddress,
      tokenId,
      amountSigned,
      decimals,
      symbol,
      nft: true,
      iconURL
    };

    return { kind, type, fromAddress, toAddress, asset };
  }

  if (logEvent.decoded.name === 'Approval') {
    const fromAddress = getEvmAddressSafe(logEvent.decoded.params.at(0)?.value);
    if (fromAddress !== accountAddress) return { kind: ActivityOperKindEnum.interaction, withAddress: contractAddress };

    const kind = ActivityOperKindEnum.approve;

    const spenderAddress = logEvent.decoded.params.at(1)!.value;

    if (!contractAddress) return { kind, spenderAddress };

    const amountOrTokenIdParam = logEvent.decoded.params.at(2);
    const amountOrTokenId: string = amountOrTokenIdParam?.value ?? '0';
    const nft = amountOrTokenIdParam?.indexed ?? false;

    const tokenId = nft ? amountOrTokenId : undefined;

    const amountSigned = nft ? '1' : amountOrTokenId;

    const asset: EvmActivityAsset = {
      contract: contractAddress,
      tokenId,
      amountSigned,
      decimals,
      symbol,
      nft,
      iconURL
    };

    return { kind, spenderAddress, asset };
  }

  if (logEvent.decoded.name === 'ApprovalForAll') {
    const fromAddress = getEvmAddressSafe(logEvent.decoded.params.at(0)?.value);

    if ((logEvent.decoded.params.at(2)!.value as unknown as boolean) !== true || fromAddress !== accountAddress)
      return { kind: ActivityOperKindEnum.interaction, withAddress: contractAddress };

    const kind = ActivityOperKindEnum.approve;

    const spenderAddress = logEvent.decoded.params.at(1)!.value;

    if (!contractAddress) return { kind, spenderAddress };

    const asset: EvmActivityAsset = {
      contract: contractAddress,
      amountSigned: null,
      // decimals: NaN, // We are not supposed to use these in this case (of 'Unlimited' amount)
      symbol,
      nft: true,
      iconURL
    };

    return { kind, spenderAddress, asset };
  }

  return { kind: ActivityOperKindEnum.interaction, withAddress: contractAddress };
}
