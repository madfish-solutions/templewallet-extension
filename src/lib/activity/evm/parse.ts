import { getAddress } from 'viem';

import { ActivityOperKindEnum, ActivityOperTransferType, EvmActivityAsset, EvmOperation } from 'lib/activity/types';
import { AssetTransfersCategory, AssetTransfersWithMetadataResult, Log } from 'lib/apis/temple/endpoints/evm/alchemy';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';

export function parseTransfer(transfer: AssetTransfersWithMetadataResult, accAddress: string): EvmOperation {
  const fromAddress = transfer.from;
  const toAddress = transfer.to;

  const logIndex = getTransferLogIndex(transfer);

  if (!fromAddress || !toAddress) return buildInteraction(transfer, accAddress);

  // (!) Note: Cannot distinguish contract addresses here
  const type =
    fromAddress === accAddress ? ActivityOperTransferType.sendToAccount : ActivityOperTransferType.receiveFromAccount;

  if (transfer.category === AssetTransfersCategory.EXTERNAL) {
    // fromAddress is an account's address for 'external' transfers

    const { decimal, value } = transfer.rawContract;

    const amount = value ? hexToStringInteger(value) : undefined;
    const amountSigned = amount ? (fromAddress === accAddress ? `-${amount}` : amount) : undefined;

    const asset: EvmActivityAsset = {
      contract: EVM_TOKEN_SLUG,
      amountSigned,
      symbol: transfer.asset ?? undefined,
      decimals: decimal ? Number(decimal) : undefined
    };

    return {
      kind: ActivityOperKindEnum.transfer,
      type,
      fromAddress,
      toAddress,
      asset,
      logIndex
    };
  }

  if (transfer.category === AssetTransfersCategory.INTERNAL) {
    // fromAddress is contract address for 'internal' transfers

    const { decimal, value } = transfer.rawContract;

    const amount = value ? hexToStringInteger(value) : undefined;
    const amountSigned = amount ? (fromAddress === accAddress ? `-${amount}` : amount) : undefined;

    const asset: EvmActivityAsset = {
      contract: EVM_TOKEN_SLUG,
      amountSigned,
      symbol: transfer.asset ?? undefined,
      decimals: decimal ? Number(decimal) : undefined
    };

    return {
      kind: ActivityOperKindEnum.transfer,
      type,
      fromAddress,
      toAddress,
      asset,
      logIndex
    };
  }

  let contractAddress = transfer.rawContract.address;
  const iconURL = contractAddress ? `https://logos.covalenthq.com/tokens/1/${contractAddress}.png` : undefined;
  contractAddress = contractAddress ? getAddress(contractAddress) : null;

  if (transfer.category === AssetTransfersCategory.ERC721) {
    if (!contractAddress) return buildInteraction(transfer, accAddress);

    const tokenId = transfer.erc721TokenId;

    const asset: EvmActivityAsset = {
      contract: contractAddress,
      tokenId: tokenId ? hexToStringInteger(tokenId) : undefined,
      amountSigned: fromAddress === accAddress ? '-1' : '1',
      symbol: transfer.asset ?? undefined,
      decimals: 0,
      nft: true,
      iconURL
    };

    return {
      kind: ActivityOperKindEnum.transfer,
      type,
      fromAddress,
      toAddress,
      asset,
      logIndex
    };
  }

  if (transfer.category === AssetTransfersCategory.ERC1155) {
    const erc1155Metadata = transfer.erc1155Metadata?.at(0);

    if (!contractAddress || !erc1155Metadata) return buildInteraction(transfer, accAddress);

    const { tokenId, value } = erc1155Metadata;

    const amount = hexToStringInteger(value);

    const asset: EvmActivityAsset = {
      contract: contractAddress,
      tokenId: tokenId ? hexToStringInteger(tokenId) : undefined,
      amountSigned: fromAddress === accAddress ? `-${amount}` : amount,
      symbol: transfer.asset ?? undefined,
      decimals: 0,
      nft: true,
      iconURL
    };

    return {
      kind: ActivityOperKindEnum.transfer,
      type,
      fromAddress,
      toAddress,
      asset,
      logIndex
    };
  }

  if (transfer.category === AssetTransfersCategory.ERC20) {
    if (!contractAddress) return buildInteraction(transfer, accAddress);

    const { decimal, value } = transfer.rawContract;

    const amount = value ? hexToStringInteger(value) : undefined;
    const amountSigned = amount ? (fromAddress === accAddress ? `-${amount}` : amount) : undefined;

    const asset: EvmActivityAsset = {
      contract: contractAddress,
      amountSigned,
      symbol: transfer.asset ?? undefined,
      decimals: decimal ? Number(decimal) : undefined,
      iconURL
    };

    return {
      kind: ActivityOperKindEnum.transfer,
      type,
      fromAddress,
      toAddress,
      asset,
      logIndex
    };
  }

  if (transfer.category === AssetTransfersCategory.SPECIALNFT) {
    if (!contractAddress) return buildInteraction(transfer, accAddress);

    const tokenId = transfer.tokenId;

    const { decimal, value } = transfer.rawContract;

    const amount = value ? hexToStringInteger(value) : undefined;
    const amountSigned = amount ? (fromAddress === accAddress ? `-${amount}` : amount) : undefined;

    const asset: EvmActivityAsset = {
      contract: contractAddress,
      tokenId: tokenId ? hexToStringInteger(tokenId) : undefined,
      amountSigned,
      symbol: transfer.asset ?? undefined,
      decimals: decimal ? Number(decimal) : undefined,
      nft: true,
      iconURL
    };

    return {
      kind: ActivityOperKindEnum.transfer,
      type,
      fromAddress,
      toAddress,
      asset,
      logIndex
    };
  }

  return buildInteraction(transfer, accAddress);
}

export function parseApprovalLog(approval: Log): EvmOperation {
  const spenderAddress = '0x' + approval.topics.at(2)!.slice(26);
  const logIndex = approval.logIndex;

  if (approval.topics[0] !== '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925') {
    // Not Approval, but ApprovalForAll method
    if (approval.data.endsWith('0'))
      return { kind: ActivityOperKindEnum.interaction, withAddress: approval.address, logIndex };

    const asset: EvmActivityAsset = {
      contract: approval.address,
      amountSigned: null,
      nft: true
    };

    return { kind: ActivityOperKindEnum.approve, spenderAddress, asset, logIndex };
  }

  const approvalOnERC721 = approval.topics.length === 4;

  const asset: EvmActivityAsset = {
    contract: approval.address,
    tokenId: approvalOnERC721 ? hexToStringInteger(approval.topics.at(3)!) : undefined,
    amountSigned: approvalOnERC721 ? '1' : hexToStringInteger(approval.data),
    nft: approvalOnERC721 ? true : undefined // Still exhaustive?
  };

  return { kind: ActivityOperKindEnum.approve, spenderAddress, asset, logIndex };
}

function buildInteraction(transfer: AssetTransfersWithMetadataResult, accAddress: string): EvmOperation {
  const withAddress = transfer.from === accAddress ? transfer.to ?? undefined : transfer.from;

  return { kind: ActivityOperKindEnum.interaction, withAddress, logIndex: getTransferLogIndex(transfer) };
}

function hexToStringInteger(hex: string) {
  return BigInt(hex).toString();
}

function getTransferLogIndex(transfer: AssetTransfersWithMetadataResult) {
  return Number(transfer.uniqueId.split(':').at(2)) || -1;
}
