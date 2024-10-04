import { GoldRushTransaction, GoldRushTransactionLogEvent } from 'lib/apis/temple/endpoints/evm';
import { toEvmAssetSlug } from 'lib/assets/utils';
import { EvmAssetMetadataGetter } from 'lib/metadata';
import { isTruthy } from 'lib/utils';
import { getEvmAddressSafe } from 'lib/utils/evm.utils';
import { TempleChainKind } from 'temple/types';

import { ActivityOperKindEnum, EvmActivity, EvmActivityAsset, EvmOperation } from '../../types';
import { getAssetSymbol } from '../../utils';

import { parseGasTransfer } from './gas';

export function parseGoldRushTransaction(
  item: GoldRushTransaction,
  chainId: number,
  accountAddress: string,
  getMetadata: EvmAssetMetadataGetter
): EvmActivity {
  const logEvents = item.log_events ?? [];
  const addedAt = item.block_signed_at as unknown as string;

  const operations = logEvents
    .map<EvmOperation | null>(logEvent => parseLogEvent(logEvent, item, accountAddress, getMetadata))
    .filter(isTruthy);

  const gasOperation = parseGasTransfer(item, accountAddress, Boolean(logEvents.length), getMetadata);

  if (gasOperation) operations.unshift(gasOperation);

  return {
    chain: TempleChainKind.EVM,
    chainId,
    hash: item.tx_hash!,
    blockExplorerUrl: item.explorers?.at(0)?.url,
    operations,
    operationsCount: gasOperation ? logEvents.length + 1 : logEvents.length,
    addedAt
  };
}

function parseLogEvent(
  logEvent: GoldRushTransactionLogEvent,
  item: GoldRushTransaction,
  accountAddress: string,
  getMetadata: EvmAssetMetadataGetter
): EvmOperation | null {
  if (!logEvent.decoded?.params) return { kind: ActivityOperKindEnum.interaction };

  const contractAddress = getEvmAddressSafe(logEvent.sender_address);
  const _fromAddress = getEvmAddressSafe(logEvent.decoded.params.at(0)?.value);
  const _toAddress = getEvmAddressSafe(logEvent.decoded.params.at(1)?.value);
  let decimals = logEvent.sender_contract_decimals;
  const iconURL = logEvent.sender_logo_url ?? undefined;

  if (logEvent.decoded.name === 'Transfer') {
    const kind = (() => {
      if (_toAddress === accountAddress) {
        return item.to_address === logEvent.sender_address
          ? ActivityOperKindEnum.transferTo_FromAccount
          : ActivityOperKindEnum.transferTo;
      }

      if (_fromAddress === accountAddress) {
        return item.to_address === logEvent.sender_address
          ? ActivityOperKindEnum.transferFrom_ToAccount
          : ActivityOperKindEnum.transferFrom;
      }

      return null;
    })();

    if (kind == null || !contractAddress) return { kind: ActivityOperKindEnum.interaction };

    const param3 = logEvent.decoded.params.at(2);
    const amountOrTokenId: string = param3?.value ?? '0';
    const nft = param3?.indexed ?? false;
    const tokenId = nft ? amountOrTokenId : undefined;

    const slug = toEvmAssetSlug(contractAddress, tokenId);
    const metadata = getMetadata(slug);

    decimals = metadata?.decimals ?? decimals;

    if (decimals == null) return { kind };

    const amount = nft ? '1' : amountOrTokenId;
    const symbol = getAssetSymbol(metadata) || logEvent.sender_contract_ticker_symbol || undefined;

    const asset: EvmActivityAsset = {
      contract: contractAddress,
      tokenId,
      amount:
        kind === ActivityOperKindEnum.transferFrom || kind === ActivityOperKindEnum.transferFrom_ToAccount
          ? `-${amount}`
          : amount,
      decimals,
      symbol,
      nft,
      iconURL
    };

    return { kind, asset };
  }

  if (logEvent.decoded.name === 'TransferSingle') {
    const fromAddress = getEvmAddressSafe(logEvent.decoded.params.at(1)?.value);
    const toAddress = getEvmAddressSafe(logEvent.decoded.params.at(2)?.value);

    const kind = (() => {
      if (toAddress === accountAddress) {
        return item.to_address === logEvent.sender_address
          ? ActivityOperKindEnum.transferTo_FromAccount
          : ActivityOperKindEnum.transferTo;
      }

      if (fromAddress === accountAddress) {
        return item.to_address === logEvent.sender_address
          ? ActivityOperKindEnum.transferFrom_ToAccount
          : ActivityOperKindEnum.transferFrom;
      }

      return null;
    })();

    if (kind == null || !contractAddress) return null;

    const tokenId = logEvent.decoded.params.at(3)?.value ?? '0';

    const slug = toEvmAssetSlug(contractAddress, tokenId);
    const metadata = getMetadata(slug);

    decimals = metadata?.decimals ?? decimals;

    if (decimals == null) return { kind };

    const amount = '1';
    const symbol = getAssetSymbol(metadata) || logEvent.sender_contract_ticker_symbol || undefined;

    const asset: EvmActivityAsset = {
      contract: contractAddress,
      tokenId,
      amount:
        kind === ActivityOperKindEnum.transferFrom || kind === ActivityOperKindEnum.transferFrom_ToAccount
          ? `-${amount}`
          : amount,
      decimals,
      symbol,
      nft: true,
      iconURL
    };

    return { kind, asset };
  }

  if (logEvent.decoded.name === 'Approval') {
    if (_fromAddress !== accountAddress) return null;

    const kind = ActivityOperKindEnum.approve;

    if (!contractAddress) return { kind };

    const amountOrTokenIdParam = logEvent.decoded.params.at(2);
    const amountOrTokenId: string = amountOrTokenIdParam?.value ?? '0';
    const nft = amountOrTokenIdParam?.indexed ?? false;

    const tokenId = nft ? amountOrTokenId : undefined;

    const slug = toEvmAssetSlug(contractAddress, tokenId);
    const metadata = getMetadata(slug);

    decimals = metadata?.decimals ?? decimals;

    if (decimals == null) return { kind };

    const symbol = getAssetSymbol(metadata) || logEvent.sender_contract_ticker_symbol || undefined;

    const asset: EvmActivityAsset = {
      contract: contractAddress,
      tokenId,
      amount: nft ? '1' : amountOrTokenId,
      decimals,
      symbol,
      nft,
      iconURL
    };

    return { kind, asset };
  }

  if (logEvent.decoded.name === 'ApprovalForAll') {
    if (
      // @ts-expect-error // `value` is not always `:string`
      logEvent.decoded.params.at(2).value !== true ||
      _fromAddress !== accountAddress
    )
      return null;

    const kind = ActivityOperKindEnum.approve;

    if (!contractAddress) return { kind };

    const asset: EvmActivityAsset = {
      contract: contractAddress,
      amount: null,
      decimals: NaN,
      symbol: logEvent.sender_contract_ticker_symbol ?? undefined,
      nft: true,
      iconURL
    };

    return { kind, asset };
  }

  return { kind: ActivityOperKindEnum.interaction };
}
