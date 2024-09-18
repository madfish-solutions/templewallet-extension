import { GoldRushERC20Transfer, GoldRushTransaction } from 'lib/apis/temple/endpoints/evm';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { toEvmAssetSlug } from 'lib/assets/utils';
import { EvmAssetMetadataGetter, getAssetSymbol } from 'lib/metadata';
import { getEvmAddressSafe } from 'lib/utils/evm.utils';
import { TempleChainKind } from 'temple/types';

import { ActivityKindEnum, EvmActivity, EvmActivityAsset, EvmOperation, InfinitySymbol } from './types';

export function parseGoldRushTransaction(
  item: GoldRushTransaction,
  chainId: number,
  accountAddress: string,
  getMetadata: EvmAssetMetadataGetter
): EvmActivity {
  const logEvents = item.log_events ?? [];

  const operations = logEvents.map<EvmOperation>(logEvent => {
    if (!logEvent.decoded?.params) return { kind: ActivityKindEnum.interaction };

    const contractAddress = getEvmAddressSafe(logEvent.sender_address);
    const fromAddress = getEvmAddressSafe(logEvent.decoded.params[0]?.value);
    const toAddress = getEvmAddressSafe(logEvent.decoded.params[1]?.value);
    let decimals = logEvent.sender_contract_decimals;
    const iconURL = logEvent.sender_logo_url ?? undefined;

    if (logEvent.decoded.name === 'Transfer') {
      const kind = (() => {
        if (fromAddress === accountAddress) return ActivityKindEnum.send;
        if (toAddress === accountAddress) return ActivityKindEnum.receive;

        return ActivityKindEnum.interaction;
      })();

      if (kind === ActivityKindEnum.interaction || !contractAddress) return { kind };

      const amountOrTokenId: string = logEvent.decoded.params[2]?.value ?? '0';
      const nft = logEvent.decoded.params[2]?.indexed ?? false;
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
        amount: kind === ActivityKindEnum.send ? `-${amount}` : amount,
        decimals,
        symbol,
        nft,
        iconURL
      };

      return { kind, asset };
    }

    if (logEvent.decoded.name === 'Approval' && fromAddress === accountAddress) {
      const kind = ActivityKindEnum.approve;

      if (!contractAddress) return { kind };

      const amountOrTokenId: string = logEvent.decoded.params[2]?.value ?? '0';
      const nft = logEvent.decoded.params[2]?.indexed ?? false;

      const tokenId = nft ? amountOrTokenId : undefined;

      const slug = toEvmAssetSlug(contractAddress, tokenId);
      const metadata = getMetadata(slug);

      decimals = metadata?.decimals ?? decimals;

      if (decimals == null) return { kind };

      const symbol = getAssetSymbol(metadata) || logEvent.sender_contract_ticker_symbol || undefined;

      const asset: EvmActivityAsset = {
        contract: contractAddress,
        tokenId,
        amount: nft ? '1' : undefined, // Often this amount is too large for non-NFTs
        decimals,
        symbol,
        nft,
        iconURL
      };

      return { kind, asset };
    }

    if (
      logEvent.decoded.name === 'ApprovalForAll' &&
      // @ts-expect-error // `value` is not always `:string`
      logEvent.decoded.params[2]?.value === true &&
      fromAddress === accountAddress
    ) {
      const kind = ActivityKindEnum.approve;

      if (!contractAddress || decimals == null) return { kind };

      const asset: EvmActivityAsset = {
        contract: contractAddress,
        amount: InfinitySymbol,
        decimals: NaN,
        symbol: logEvent.sender_contract_ticker_symbol ?? undefined,
        nft: true,
        iconURL
      };

      return { kind, asset };
    }

    return { kind: ActivityKindEnum.interaction };
  });

  const gasOperation = parseGasTransfer(item, accountAddress, getMetadata);

  if (gasOperation) operations.unshift(gasOperation);

  return {
    chain: TempleChainKind.EVM,
    chainId,
    hash: item.tx_hash!,
    blockExplorerUrl: item.explorers?.[0]?.url,
    operations
  };
}

export function parseGoldRushERC20Transfer(
  item: GoldRushERC20Transfer,
  chainId: number,
  accountAddress: string,
  getMetadata: EvmAssetMetadataGetter
): EvmActivity {
  const operations =
    item.transfers?.map<EvmOperation>(transfer => {
      const kind = transfer.transfer_type === 'IN' ? ActivityKindEnum.receive : ActivityKindEnum.send;

      const contractAddress = getEvmAddressSafe(transfer.contract_address);

      if (contractAddress == null) return { kind };

      const slug = toEvmAssetSlug(contractAddress);
      const metadata = getMetadata(slug);

      const decimals = metadata?.decimals ?? transfer.contract_decimals;

      if (decimals == null) return { kind: ActivityKindEnum.interaction };

      const nft = false;
      const amount = nft ? '1' : transfer.delta?.toString() ?? '0';
      const symbol = getAssetSymbol(metadata) || transfer.contract_ticker_symbol || undefined;

      const asset: EvmActivityAsset = {
        contract: contractAddress,
        amount: kind === ActivityKindEnum.send ? `-${amount}` : amount,
        decimals,
        symbol,
        nft,
        iconURL: transfer.logo_url ?? undefined
      };

      return { kind, asset };
    }) ?? [];

  const gasOperation = parseGasTransfer(item, accountAddress, getMetadata);

  if (gasOperation) operations.unshift(gasOperation);

  return {
    chain: TempleChainKind.EVM,
    chainId,
    hash: item.tx_hash!,
    blockExplorerUrl: item.transfers?.[0].explorers?.[0]?.url,
    operations
  };
}

function parseGasTransfer(
  item: GoldRushTransaction | GoldRushERC20Transfer,
  accountAddress: string,
  getMetadata: EvmAssetMetadataGetter
): EvmOperation | null {
  const value: string = item.value?.toString() ?? '0';

  if (value === '0') return null;

  const kind = (() => {
    if (getEvmAddressSafe(item.from_address) === accountAddress) return ActivityKindEnum.send;
    if (getEvmAddressSafe(item.to_address) === accountAddress) return ActivityKindEnum.receive;

    return null;
  })();

  if (!kind) return null;

  const metadata = getMetadata(EVM_TOKEN_SLUG);
  const decimals = metadata?.decimals ?? item.gas_metadata?.contract_decimals;

  if (decimals == null) return null;

  const symbol = getAssetSymbol(metadata) || item.gas_metadata?.contract_ticker_symbol;

  const asset: EvmActivityAsset = {
    contract: EVM_TOKEN_SLUG,
    amount: kind === ActivityKindEnum.send ? `-${value}` : value,
    decimals,
    symbol
  };

  return { kind, asset };
}
