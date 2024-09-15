import { GoldRushTransaction } from 'lib/apis/temple/endpoints/evm';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { getEvmAddressSafe } from 'lib/utils/evm.utils';
import { TempleChainKind } from 'temple/types';

export enum ActivityKindEnum {
  interaction,
  send,
  receive,
  swap,
  approve
}

export type Activity = TezosActivity | EvmActivity;

interface TezosActivity {
  chain: TempleChainKind.Tezos;
  chainId: string;
  hash: string;
  operations: TezosOperation[];
}

interface TezosOperation {
  kind: ActivityKindEnum;
}

interface EvmActivity {
  chain: TempleChainKind.EVM;
  chainId: number;
  hash: string;
  blockExplorerUrl?: string;
  operations: EvmOperation[];
}

export interface EvmOperation {
  kind: ActivityKindEnum;
  asset?: EvmActivityAsset;
}

interface EvmActivityAsset {
  contract: string;
  tokenId?: string;
  amount?: string | typeof InfinitySymbol;
  decimals: number;
  nft?: boolean;
  symbol?: string;
  iconURL?: string;
}

export const InfinitySymbol = Symbol('Infinity');

export function parseGoldRushTransaction(
  item: GoldRushTransaction,
  chainId: number,
  accountAddress: string
): EvmActivity {
  const logEvents = item.log_events ?? [];

  const operations = logEvents.map<EvmOperation>(logEvent => {
    if (!logEvent.decoded?.params) return { kind: ActivityKindEnum.interaction };

    const fromAddress = getEvmAddressSafe(logEvent.decoded.params[0]?.value);
    const toAddress = getEvmAddressSafe(logEvent.decoded.params[1]?.value);
    const contractAddress = getEvmAddressSafe(logEvent.sender_address);
    const decimals = logEvent.sender_contract_decimals;
    const iconURL = logEvent.sender_logo_url ?? undefined;

    if (logEvent.decoded.name === 'Transfer') {
      const kind = (() => {
        if (fromAddress === accountAddress) return ActivityKindEnum.send;
        if (toAddress === accountAddress) return ActivityKindEnum.receive;

        return ActivityKindEnum.interaction;
      })();

      if (kind === ActivityKindEnum.interaction) return { kind };

      if (!contractAddress || decimals == null) return { kind };

      const amountOrTokenId: string = logEvent.decoded.params[2]?.value ?? '0';
      const nft = logEvent.decoded.params[2]?.indexed ?? false;

      const amount = nft ? '1' : amountOrTokenId;

      const asset: EvmActivityAsset = {
        contract: contractAddress,
        tokenId: nft ? amountOrTokenId : undefined,
        amount: kind === ActivityKindEnum.send ? `-${amount}` : amount,
        decimals: nft ? 0 : decimals ?? 0,
        symbol: logEvent.sender_contract_ticker_symbol ?? undefined,
        nft,
        iconURL
      };

      return { kind, asset };
    }

    if (logEvent.decoded.name === 'Approval' && fromAddress === accountAddress) {
      const kind = ActivityKindEnum.approve;

      const amountOrTokenId: string = logEvent.decoded.params[2]?.value ?? '0';
      const nft = logEvent.decoded.params[2]?.indexed ?? false;

      if (!contractAddress || decimals == null) return { kind };

      const asset: EvmActivityAsset = {
        contract: contractAddress,
        tokenId: nft ? amountOrTokenId : undefined,
        amount: nft ? '1' : undefined, // Often this amount is too large for non-NFTs
        decimals,
        symbol: logEvent.sender_contract_ticker_symbol ?? undefined,
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
        decimals,
        symbol: logEvent.sender_contract_ticker_symbol ?? undefined,
        nft: true,
        iconURL
      };

      return { kind, asset };
    }

    return { kind: ActivityKindEnum.interaction };
  });

  const gasOperation: EvmOperation | null = (() => {
    const kind = (() => {
      if (getEvmAddressSafe(item.from_address) === accountAddress) return ActivityKindEnum.send;
      if (getEvmAddressSafe(item.to_address) === accountAddress) return ActivityKindEnum.receive;

      return null;
    })();

    if (!kind) return null;

    const decimals = item.gas_metadata?.contract_decimals;
    if (decimals == null) return null;

    const value: string = item.value?.toString() ?? '0';

    const asset: EvmActivityAsset = {
      contract: EVM_TOKEN_SLUG,
      amount: kind === ActivityKindEnum.send ? `-${value}` : value,
      decimals: decimals ?? 0,
      symbol: item.gas_metadata?.contract_ticker_symbol
    };

    return { kind, asset };
  })();

  if (gasOperation) operations.unshift(gasOperation);

  return {
    chain: TempleChainKind.EVM,
    chainId,
    hash: item.tx_hash!,
    blockExplorerUrl: item.explorers?.[0]?.url,
    operations
  };
}
