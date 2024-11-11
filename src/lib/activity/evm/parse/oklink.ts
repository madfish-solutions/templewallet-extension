import {
  ActivityOperKindEnum,
  ActivityOperTransferType,
  ActivityStatus,
  EvmActivity,
  EvmActivityAsset,
  EvmOperation
} from 'lib/activity/types';
import { TransactionFillsResponseDataItem } from 'lib/apis/oklink';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { TempleChainKind } from 'temple/types';

export function parseOklinkTransaction(
  item: TransactionFillsResponseDataItem,
  chainId: number,
  accountAddress: string
): EvmActivity {
  const accountAddressLowerCased = accountAddress.toLowerCase();

  const status =
    item.state === 'success'
      ? ActivityStatus.applied
      : item.state === 'pending'
      ? ActivityStatus.pending
      : ActivityStatus.failed;

  const operations = item.tokenTransferDetails.map(transfer =>
    parseTransferDetails(transfer, accountAddressLowerCased, item)
  );

  const gasOperation = parseForGasOperation(item, accountAddressLowerCased);

  const rootOperation = parseForRootOperation(item, accountAddressLowerCased);

  if (rootOperation) operations.unshift(rootOperation);
  if (gasOperation) operations.unshift(gasOperation);

  const operationsCount =
    item.tokenTransferDetails.length +
    // + item.contractDetails.length // Not length, subset of it
    (gasOperation ? 1 : 0) +
    (rootOperation ? 1 : 0);

  return {
    chain: TempleChainKind.EVM,
    chainId,
    hash: item.txid,
    operations,
    operationsCount,
    status,
    addedAt: new Date(Number(item.transactionTime)).toISOString(),
    blockHeight: item.height
  };
}

function parseTransferDetails(
  item: TransactionFillsResponseDataItem['tokenTransferDetails'][number],
  accountAddress: string,
  fillsRes: TransactionFillsResponseDataItem
): EvmOperation {
  const fromAddress = item.from;
  const toAddress = item.to;

  const type = (() => {
    if (fromAddress === accountAddress)
      return item.isToContract ? ActivityOperTransferType.send : ActivityOperTransferType.sendToAccount;
    if (toAddress === accountAddress)
      return item.isFromContract ? ActivityOperTransferType.receive : ActivityOperTransferType.receiveFromAccount;

    return null;
  })();

  if (type == null)
    return {
      kind: ActivityOperKindEnum.interaction,
      withAddress: fillsRes.outputDetails[0].outputHash
      // withAddress: item.tokenContractAddress
    };

  const { amount, tokenId, symbol } = item;

  const amountSigned =
    type === ActivityOperTransferType.send || type === ActivityOperTransferType.sendToAccount ? `-${amount}` : amount;

  const asset: EvmActivityAsset = {
    contract: item.tokenContractAddress,
    tokenId,
    amountSigned,
    // decimals,
    symbol
    // nft
  };

  return {
    kind: ActivityOperKindEnum.transfer,
    type,
    fromAddress,
    toAddress,
    asset
  };
}

function parseForRootOperation(item: TransactionFillsResponseDataItem, accountAddress: string): EvmOperation | null {
  if (item.tokenTransferDetails.length || item.contractDetails.length) return null;

  if (item.methodId === KnownMethodsEnum.ApprovalForAll) {
    if (item.inputDetails[0].inputHash !== accountAddress) return null;

    const kind = ActivityOperKindEnum.approve;

    const contractAddress = item.outputDetails[0].outputHash;

    const spenderAddress = item.inputData.match(ApprovalForAllMethodRegEx)?.[1];
    if (!spenderAddress) return null;

    const asset: EvmActivityAsset = {
      contract: contractAddress,
      amountSigned: null,
      // decimals: NaN, // We are not supposed to use these in this case (of 'Unlimited' amount)
      // symbol,
      nft: true
      // iconURL
    };

    return { kind, spenderAddress: `0x${spenderAddress}`, asset };
  }

  /*
  if (item.methodId === KnownMethodsEnum.Approval) {
    if (item.inputDetails[0].inputHash !== accountAddress) return null;

    const kind = ActivityOperKindEnum.approve;

    const contractAddress = item.outputDetails[0].outputHash;

    const spenderAddress = item.inputData.match(ApprovalMethodRegEx)?.[1];
    if (!spenderAddress) return null;

    const asset: EvmActivityAsset = {
      contract: contractAddress,
      tokenId,
      amountSigned,
      // decimals,
      // symbol,
      nft,
      // iconURL
    };

    return { kind, spenderAddress: `0x${spenderAddress}`, asset };
  }
  */

  return null;
}

enum KnownMethodsEnum {
  Approval = '0x095ea7b3',
  ApprovalForAll = '0xa22cb465'
}

const ApprovalMethodRegEx = new RegExp(`${KnownMethodsEnum.Approval}${'0'.repeat(24)}(.{40})`);
const ApprovalForAllMethodRegEx = new RegExp(`${KnownMethodsEnum.ApprovalForAll}${'0'.repeat(24)}(.{40})`);

function parseForGasOperation(item: TransactionFillsResponseDataItem, accountAddress: string): EvmOperation | null {
  const amount = item.amount;
  if (amount === '0') return null;

  const inputDetails = item.inputDetails[0];
  const outputDetails = item.outputDetails[0];

  const fromAddress = inputDetails.inputHash;
  const toAddress = outputDetails.outputHash;

  const type = (() => {
    if (fromAddress === accountAddress)
      return outputDetails.isContract ? ActivityOperTransferType.send : ActivityOperTransferType.sendToAccount;
    if (toAddress === accountAddress)
      return inputDetails.isContract ? ActivityOperTransferType.receive : ActivityOperTransferType.receiveFromAccount;

    return null;
  })();

  if (type == null) return null;

  const kind = ActivityOperKindEnum.transfer;

  const amountSigned =
    type === ActivityOperTransferType.send || type === ActivityOperTransferType.sendToAccount ? `-${amount}` : amount;

  const asset: EvmActivityAsset = {
    contract: EVM_TOKEN_SLUG,
    amountSigned,
    // decimals,
    symbol: item.transactionSymbol
  };

  return { kind, type, fromAddress, toAddress, asset };
}
