import { isDefined } from '@rnw-community/shared';

import {
  ActivityOperKindEnum,
  ActivityOperTransferType,
  ActivityStatus,
  EvmActivity,
  EvmActivityAsset,
  EvmOperation
} from 'lib/activity';
import { parseApprovalLog } from 'lib/activity/evm/parse';
import {
  EtherlinkChainId,
  EtherlinkInternalTx,
  EtherlinkOperationsPageParams,
  EtherlinkTokenTransfer,
  EtherlinkTokenTransfersPageParams,
  EtherlinkTransaction,
  fetchAllInternalTokensTransfers,
  fetchAllInternalTransactions,
  fetchAllTxLogs,
  fetchGetAccountOperations,
  fetchGetCoinBalanceHistory,
  fetchGetTokensTransfers,
  isErc20TokenTransfer,
  isErc721TokenTransfer
} from 'lib/apis/etherlink';
import { toEvmAssetSlug } from 'lib/assets/utils';
import { EVM_ZERO_ADDRESS } from 'lib/constants';
import { EvmOperationKind, getOperationKind } from 'lib/evm/on-chain/transactions';
import { equalsIgnoreCase } from 'lib/evm/on-chain/utils/common.utils';
import { EvmAssetStandard } from 'lib/evm/types';
import { getEvmNativeAssetIcon } from 'lib/images-uri';
import { EvmCollectibleMetadata, EvmTokenMetadata } from 'lib/metadata/types';
import { getSeparateEvmActivities } from 'lib/temple/activity/repo';
import { DEFAULT_EVM_CHAINS_SPECS } from 'lib/temple/chains-specs';
import { TempleChainKind } from 'temple/types';

export interface AllEtherlinkActivitiesPageParams {
  operationsPageParams: EtherlinkOperationsPageParams | nullish;
  tokensTransfersPageParams: EtherlinkTokenTransfersPageParams | nullish;
}

export const ETHERLINK_ITEMS_PER_PAGE = 50;

export const getBlockNumberFromEtherlinkOlderThan = (olderThan: AllEtherlinkActivitiesPageParams | undefined) => {
  const { operationsPageParams, tokensTransfersPageParams } = olderThan ?? {};
  const { block_number: blockNumber } = operationsPageParams ?? tokensTransfersPageParams ?? {};

  return blockNumber;
};

export const fetchEtherlinkActivities = async (
  currentOlderThan: AllEtherlinkActivitiesPageParams | undefined,
  chainId: EtherlinkChainId,
  accountAddress: HexString,
  signal?: AbortSignal
) => {
  const {
    explicitOperations,
    explicitOperationsNextPageParams,
    coinBalanceHistoryItems,
    tokensTransfers,
    tokensTransfersNextPageParams
  } = await getEtherlinkHistoryData(currentOlderThan, chainId, accountAddress, signal);

  const assetsMetadata: StringRecord<EvmTokenMetadata | EvmCollectibleMetadata> = {};
  const rawActivitiesByHash: StringRecord<{
    tx?: EtherlinkTransaction;
    tokensTransfers: EtherlinkTokenTransfer[];
    nativeCoinDelta: string;
  }> = {};
  explicitOperations.forEach((op, i) => {
    const fee = op.fee?.value ?? '0';
    const { delta: nativeCoinDeltaWithFee } = coinBalanceHistoryItems[i] ?? { delta: `-${fee}` };

    rawActivitiesByHash[op.hash] = {
      tx: op,
      tokensTransfers: [],
      nativeCoinDelta: (BigInt(nativeCoinDeltaWithFee) + BigInt(fee)).toString()
    };
  });
  tokensTransfers.forEach(transfer => {
    const { transaction_hash: txHash } = transfer;
    if (rawActivitiesByHash[txHash]) {
      rawActivitiesByHash[txHash].tokensTransfers.push(transfer);
    } else {
      rawActivitiesByHash[txHash] = {
        tokensTransfers: [transfer],
        nativeCoinDelta: '0'
      };
    }
    if (isErc20TokenTransfer(transfer)) {
      const { address_hash: address, decimals, symbol, name, icon_url: iconURL } = transfer.token;
      assetsMetadata[toEvmAssetSlug(address)] = nullToUndefined({
        standard: EvmAssetStandard.ERC20,
        symbol,
        address,
        name,
        decimals: decimals ? Number(decimals) : undefined,
        iconURL
      });
    } else {
      const {
        token,
        id: tokenId,
        metadata,
        image_url: fullImageUrl,
        external_app_url: externalUrl,
        animation_url: animationUrl
      } = transfer.total.token_instance;
      const { address_hash: address, symbol, name: tokenName, decimals: rawDecimals, icon_url: iconFallback } = token;
      const { attributes, description, name: collectibleName, image: metadataImage } = metadata ?? {};
      const iconURL = metadataImage ?? iconFallback;

      assetsMetadata[toEvmAssetSlug(address, tokenId)] = nullToUndefined({
        symbol,
        address,
        name: tokenName,
        decimals: Number(rawDecimals ?? 0),
        iconURL,
        tokenId,
        image: fullImageUrl ?? metadataImage,
        collectibleName,
        description,
        attributes,
        externalUrl,
        animationUrl
      });
    }
  });

  const alreadyKnownActivities = await getSeparateEvmActivities(
    chainId,
    accountAddress,
    Object.keys(rawActivitiesByHash)
  );
  const alreadyKnownActivitiesByHash = Object.fromEntries(
    alreadyKnownActivities.map(activity => [activity.hash, activity])
  );
  const activitiesByHash: StringRecord<EvmActivity> = {};

  for (const hash in rawActivitiesByHash) {
    const alreadyKnownActivity = alreadyKnownActivitiesByHash[hash];
    if (alreadyKnownActivity) {
      activitiesByHash[hash] = alreadyKnownActivity;
      continue;
    }

    const { tx, tokensTransfers, nativeCoinDelta } = rawActivitiesByHash[hash];
    const operations = tx
      ? await toUnorderedOperations(tx, tokensTransfers, nativeCoinDelta, accountAddress, chainId, signal)
      : tokensTransfers.map(transfer => parseTokenTransfer(transfer, accountAddress));
    operations.sort((a, b) => a.logIndex - b.logIndex);

    activitiesByHash[hash] = {
      chain: TempleChainKind.EVM,
      hash: tx?.hash ?? tokensTransfers[0].transaction_hash,
      operationsCount: operations.length,
      /** ISO string */
      addedAt: (tx ?? tokensTransfers[0]).timestamp,
      status: tx?.status === 'error' ? ActivityStatus.failed : ActivityStatus.applied,
      chainId,
      operations,
      blockHeight: `${(tx ?? tokensTransfers[0]).block_number}`,
      index: tx?.position ?? null,
      fee: tx ? tx.fee?.value ?? '0' : null,
      value: tx?.value ?? null
    };
  }

  return {
    allActivities: Object.values(activitiesByHash).sort(
      ({ blockHeight: aLevel, index: aIndex }, { blockHeight: bLevel, index: bIndex }) =>
        Number(aLevel) === Number(bLevel) ? (bIndex ?? 0) - (aIndex ?? 0) : Number(bLevel) - Number(aLevel)
    ),
    nextPageParams: {
      operationsPageParams: explicitOperationsNextPageParams,
      tokensTransfersPageParams: tokensTransfersNextPageParams
    },
    assetsMetadata
  };
};

const erc20ApprovalEventRegex = /Approval\(address indexed [A-z_]+, address indexed [A-z_]+, uint256 [A-z_]+\)/;
const erc721SingleApprovalEventRegex =
  /Approval\(address indexed [A-z_]+, address indexed [A-z_]+, uint256 indexed [A-z_]+\)/;

type NullToUndefined<T extends object> = {
  [K in keyof T]: Replace<T[K], null, undefined>;
};
const nullToUndefined = <T extends object>(obj: T): NullToUndefined<T> => {
  const result: Partial<NullToUndefined<T>> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      // @ts-expect-error
      result[key] = obj[key] === null ? undefined : obj[key];
    }
  }
  return result as NullToUndefined<T>;
};

const getEtherlinkHistoryData = async (
  currentOlderThan: AllEtherlinkActivitiesPageParams | undefined,
  chainId: EtherlinkChainId,
  accountAddress: HexString,
  signal?: AbortSignal
) => {
  const { operationsPageParams, tokensTransfersPageParams } = currentOlderThan ?? {};
  let explicitOperations: EtherlinkTransaction[];
  let explicitOperationsNextPageParams: EtherlinkOperationsPageParams | nullish;
  const explicitOperationsPage =
    operationsPageParams === null
      ? { items: [], next_page_params: null }
      : await fetchGetAccountOperations({
          chainId,
          address: accountAddress,
          pageParams: operationsPageParams,
          signal
        });
  explicitOperations = explicitOperationsPage.items;
  explicitOperationsNextPageParams = explicitOperationsPage.next_page_params;
  let { items: coinBalanceHistoryItems } =
    operationsPageParams === null
      ? { items: [] }
      : await fetchGetCoinBalanceHistory({
          chainId,
          address: accountAddress,
          signal,
          pageParams: operationsPageParams && {
            block_number: operationsPageParams.block_number,
            items_count: operationsPageParams.items_count
          }
        });
  let tokensTransfers: EtherlinkTokenTransfer[];
  let tokensTransfersNextPageParams: EtherlinkTokenTransfersPageParams | nullish;
  const tokensTransfersPage =
    tokensTransfersPageParams === null
      ? { items: [], next_page_params: null }
      : await fetchGetTokensTransfers({
          address: accountAddress,
          pageParams: tokensTransfersPageParams,
          signal,
          chainId
        });
  tokensTransfers = tokensTransfersPage.items;
  tokensTransfersNextPageParams = tokensTransfersPage.next_page_params;
  if (
    explicitOperationsNextPageParams &&
    tokensTransfersNextPageParams &&
    explicitOperationsNextPageParams.block_number <= tokensTransfersNextPageParams.block_number
  ) {
    const lastTransferHash = tokensTransfers.at(-1)!.transaction_hash;
    const lastTxTokensTransfers = await fetchAllInternalTokensTransfers({
      txHash: lastTransferHash,
      chainId,
      signal
    });
    tokensTransfers = tokensTransfers
      .filter(({ transaction_hash }) => transaction_hash !== lastTransferHash)
      .concat(
        lastTxTokensTransfers
          .filter(({ from, to }) => [from, to].some(({ hash }) => equalsIgnoreCase(hash, accountAddress)))
          .sort(({ log_index: aLogIndex }, { log_index: bLogIndex }) => bLogIndex - aLogIndex) ?? []
      );
    const lastTokenTransfer = tokensTransfers.at(-1)!;
    tokensTransfersNextPageParams = {
      block_number: lastTokenTransfer.block_number,
      index: lastTokenTransfer.log_index
    };

    explicitOperations = explicitOperations.filter(
      ({ block_number: blockNumber }) => blockNumber >= tokensTransfersNextPageParams!.block_number
    );
    coinBalanceHistoryItems = coinBalanceHistoryItems.filter(
      ({ block_number: blockNumber }) => blockNumber >= tokensTransfersNextPageParams!.block_number
    );
    const lastExplicitOperation = explicitOperations.at(-1);
    if (lastExplicitOperation) {
      const { block_number, fee, hash, position, timestamp, value } = lastExplicitOperation;
      explicitOperationsNextPageParams = {
        block_number,
        fee: fee?.value ?? '0',
        hash,
        index: position,
        inserted_at: timestamp,
        items_count: (operationsPageParams?.items_count ?? 0) + explicitOperations.length,
        value
      };
    } else {
      explicitOperationsNextPageParams = operationsPageParams;
    }
  } else if (explicitOperationsNextPageParams && tokensTransfersNextPageParams) {
    const { block_number: lastOperationBlockNumber } = explicitOperations.at(-1)!;
    const earliestBlockNumberOperationsHashes = new Set(
      explicitOperations
        .filter(({ block_number: blockNumber }) => blockNumber === lastOperationBlockNumber)
        .map(({ hash }) => hash.toLowerCase())
    );
    tokensTransfers = tokensTransfers.filter(
      ({ block_number: blockNumber, transaction_hash: txHash }) =>
        blockNumber > lastOperationBlockNumber || earliestBlockNumberOperationsHashes.has(txHash.toLowerCase())
    );
    const lastTokenTransfer = tokensTransfers.at(-1);
    tokensTransfersNextPageParams = lastTokenTransfer
      ? {
          block_number: lastTokenTransfer.block_number,
          index: lastTokenTransfer.log_index
        }
      : tokensTransfersPageParams;
  }

  return {
    explicitOperations,
    explicitOperationsNextPageParams,
    coinBalanceHistoryItems,
    tokensTransfers,
    tokensTransfersNextPageParams
  };
};

const parseTokenTransfer = (transfer: EtherlinkTokenTransfer, accountAddress: HexString): EvmOperation => {
  const { from, to, log_index: logIndex } = transfer;
  const isSending = equalsIgnoreCase(from.hash, accountAddress);
  const amountNotSigned = isErc721TokenTransfer(transfer) ? '1' : transfer.total.value;
  const assetIsToken = isErc20TokenTransfer(transfer);
  let asset: EvmActivityAsset;
  if (assetIsToken) {
    const { address_hash: address, decimals, symbol, name, icon_url: iconURL } = transfer.token;
    asset = nullToUndefined({
      contract: address,
      amountSigned: isSending ? `-${amountNotSigned}` : amountNotSigned,
      decimals: decimals ? Number(decimals) : undefined,
      nft: false,
      symbol,
      name,
      iconURL
    });
  } else {
    const { token, id: tokenId, metadata } = transfer.total.token_instance;
    const { address_hash: address, symbol, name: tokenName, decimals: rawDecimals, icon_url: iconFallback } = token;
    const { image: metadataImage } = metadata ?? {};
    const decimals = rawDecimals ? Number(rawDecimals) : undefined;
    const iconURL = metadataImage ?? iconFallback;

    asset = nullToUndefined({
      contract: address,
      tokenId,
      amountSigned: isSending ? `-${amountNotSigned}` : amountNotSigned,
      decimals,
      nft: true,
      symbol,
      name: tokenName,
      iconURL
    });
  }

  return {
    kind: ActivityOperKindEnum.transfer,
    fromAddress: from.hash,
    toAddress: to.hash,
    asset,
    logIndex,
    type: equalsIgnoreCase(from.hash, accountAddress)
      ? ActivityOperTransferType.sendToAccount
      : ActivityOperTransferType.receiveFromAccount
  };
};

const getApprovalsForAccount = async (
  tx: EtherlinkTransaction,
  chainId: EtherlinkChainId,
  accountAddress: HexString,
  signal?: AbortSignal
) => {
  const logEntries = await fetchAllTxLogs({ chainId, txHash: tx.hash, signal });

  return logEntries
    .filter(
      ({ decoded, topics }) =>
        [erc20ApprovalEventRegex, erc721SingleApprovalEventRegex].some(regex => decoded?.method_call.match(regex)) &&
        equalsIgnoreCase(topics[1] ? `0x${topics[1].slice(-40)}` : undefined, accountAddress)
    )
    .map(logEntry => {
      const { topics, index: logIndex, data, address } = logEntry;
      const { hash: tokenAddress } = address;

      return parseApprovalLog({ topics: topics.filter(isDefined), logIndex, data, address: tokenAddress });
    });
};

const toUnorderedOperations = async (
  tx: EtherlinkTransaction,
  tokensTransfers: EtherlinkTokenTransfer[],
  nativeCoinDelta: string,
  accountAddress: HexString,
  chainId: EtherlinkChainId,
  signal?: AbortSignal
): Promise<EvmOperation[]> => {
  const { to, position, raw_input, value, status } = tx;
  const isSuccessful = status === 'ok';
  const toAddress = to?.hash;
  const parsedTokensTransfers = tokensTransfers.map(transfer => parseTokenTransfer(transfer, accountAddress));

  const operationKind = getOperationKind({ data: raw_input, to: toAddress, value: BigInt(value) });
  const gasTokenTransfer = makeGasTokenTransfer(tx, chainId, accountAddress);
  const fallbackOperations: EvmOperation[] = [
    {
      kind: ActivityOperKindEnum.interaction,
      logIndex: position,
      withAddress: toAddress,
      asset: Number(value) > 0 ? { ...makeGasAsset(chainId), amountSigned: `-${value}` } : undefined
    }
  ];

  switch (operationKind) {
    case EvmOperationKind.DeployContract:
      return parsedTokensTransfers.concat(fallbackOperations);
    case EvmOperationKind.Send:
    case EvmOperationKind.Mint:
      return raw_input === '0x'
        ? [gasTokenTransfer]
        : parsedTokensTransfers.length
        ? parsedTokensTransfers.concat(Number(value) ? gasTokenTransfer : [])
        : fallbackOperations;
    case EvmOperationKind.Approval:
      const approvals = await getApprovalsForAccount(tx, chainId, accountAddress, signal);

      return approvals.length ? approvals : fallbackOperations;
    case EvmOperationKind.ApprovalForAll:
      return [{ kind: ActivityOperKindEnum.interaction, logIndex: position, withAddress: toAddress }];
    default:
      if (!isSuccessful) {
        return fallbackOperations;
      }

      const hasGasTokenReceiveOperations = BigInt(nativeCoinDelta) + BigInt(value) > BigInt(0);
      if (tokensTransfers.length || hasGasTokenReceiveOperations) {
        let gasTokenReceiveOperations: EvmOperation[] = [];
        if (hasGasTokenReceiveOperations) {
          const internalOperations = await fetchAllInternalTransactions({
            txHash: tx.hash,
            chainId,
            signal
          });
          gasTokenReceiveOperations = internalOperations
            .filter(({ to, value }) => equalsIgnoreCase(to?.hash, accountAddress) && Number(value) > 0)
            .map(operation => makeGasTokenTransfer(operation, chainId, accountAddress));
        }

        return parsedTokensTransfers.concat(gasTokenReceiveOperations).concat(Number(value) ? gasTokenTransfer : []);
      } else {
        const approvalOperations = await getApprovalsForAccount(tx, chainId, accountAddress, signal);

        return approvalOperations.length ? approvalOperations : fallbackOperations;
      }
  }
};

const makeGasTokenTransfer = (
  tx: EtherlinkTransaction | EtherlinkInternalTx,
  chainId: EtherlinkChainId,
  accountAddress: HexString
): EvmOperation => {
  const { from, to, value } = tx;
  const { hash: fromAddress } = from;
  const isSending = equalsIgnoreCase(fromAddress, accountAddress);

  return {
    kind: ActivityOperKindEnum.transfer,
    fromAddress: fromAddress,
    toAddress: to?.hash ?? EVM_ZERO_ADDRESS,
    asset: { ...makeGasAsset(chainId), amountSigned: isSending ? `-${value}` : value },
    logIndex: 'position' in tx ? tx.position : tx.index,
    type: isSending ? ActivityOperTransferType.sendToAccount : ActivityOperTransferType.receiveFromAccount
  };
};

const makeGasAsset = (chainId: EtherlinkChainId) => {
  const { address: gasAddress, decimals: gasDecimals, symbol: gasSymbol } = DEFAULT_EVM_CHAINS_SPECS[chainId].currency!;
  return {
    contract: gasAddress,
    decimals: gasDecimals,
    nft: false,
    symbol: gasSymbol,
    iconURL: getEvmNativeAssetIcon(chainId, undefined, 'llamao') ?? undefined
  };
};
