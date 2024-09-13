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

interface ActivityBase {
  kind: ActivityKindEnum;
}

interface TezosActivity extends ActivityBase {
  chain: TempleChainKind.Tezos;
  chainId: string;
  hash: string;
  operations: TezosOperation[];
}

interface TezosOperation {
  kind: ActivityKindEnum;
}

interface EvmActivity extends ActivityBase {
  chain: TempleChainKind.EVM;
  chainId: number;
  hash: string;
  blockExplorerUrl?: string;
  asset?: EvmActivityAsset;
  operations: EvmOperation[];
}

export interface EvmOperation extends ActivityBase {
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

  const { kind, asset } = ((): { kind: ActivityKindEnum; asset?: EvmActivityAsset } => {
    if (!logEvents.length) {
      const kind = (() => {
        if (getEvmAddressSafe(item.from_address) === accountAddress) return ActivityKindEnum.send;
        if (getEvmAddressSafe(item.to_address) === accountAddress) return ActivityKindEnum.receive;

        return ActivityKindEnum.interaction;
      })();

      if (kind === ActivityKindEnum.interaction) return { kind };

      const decimals = item.gas_metadata?.contract_decimals;
      if (decimals == null) return { kind };

      const value: string = item.value?.toString() ?? '0';

      const nft = false;

      const asset: EvmActivityAsset = {
        contract: EVM_TOKEN_SLUG,
        amount: nft ? '1' : kind === ActivityKindEnum.send ? `-${value}` : value,
        decimals: nft ? 0 : decimals ?? 0,
        symbol: item.gas_metadata?.contract_ticker_symbol
      };

      return { kind, asset };
    }

    if (logEvents.length !== 1) return { kind: ActivityKindEnum.interaction };

    const logEvent = logEvents[0]!;

    if (!logEvent.decoded) return { kind: ActivityKindEnum.interaction };

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

      const amountOrTokenId: string = logEvent.decoded.params[2]?.value ?? '0';
      const nft = logEvent.decoded.params[2]?.indexed ?? false;

      if (!contractAddress || decimals == null) return { kind };

      const asset: EvmActivityAsset = {
        contract: contractAddress,
        tokenId: nft ? amountOrTokenId : undefined,
        amount: nft ? '1' : kind === ActivityKindEnum.send ? `-${amountOrTokenId}` : amountOrTokenId,
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
  })();

  const operations = logEvents.map<EvmOperation>(logEvent => {
    const kind: ActivityKindEnum = (() => {
      // if (logEvent.decoded?.name === 'Approval') return ActivityKindEnum.approve;

      if (logEvent.decoded?.name === 'Transfer') {
        if (getEvmAddressSafe(logEvent.decoded.params[0]?.value) === accountAddress) return ActivityKindEnum.send;
        if (getEvmAddressSafe(logEvent.decoded.params[1]?.value) === accountAddress) return ActivityKindEnum.receive;
      }

      return ActivityKindEnum.interaction;
    })();

    const iconURL = logEvent.sender_logo_url ?? undefined;

    return {
      kind,
      asset: (() => {
        if (kind !== ActivityKindEnum.send && kind !== ActivityKindEnum.receive) return;

        const amountOrTokenId: string = logEvent.decoded?.params[2]?.value ?? '0';
        const decimals = logEvent.sender_contract_decimals;
        const contractAddress = getEvmAddressSafe(logEvent.sender_address);
        const nft = logEvent.decoded?.params[2]?.indexed ?? false;

        if (!contractAddress || decimals == null) return;

        const amount = nft ? '1' : amountOrTokenId;

        return {
          contract: contractAddress,
          tokenId: nft ? amountOrTokenId : undefined,
          amount: kind === ActivityKindEnum.send ? `-${amount}` : amount,
          decimals,
          symbol: logEvent.sender_contract_ticker_symbol ?? undefined,
          nft,
          iconURL
        };
      })()
    };
  });

  return {
    chain: TempleChainKind.EVM,
    chainId,
    kind,
    hash: item.tx_hash!,
    blockExplorerUrl: item.explorers?.[0]?.url,
    asset,
    operations
  };
}
