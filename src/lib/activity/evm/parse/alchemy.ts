import { AssetTransfersCategory, AssetTransfersWithMetadataResult } from 'alchemy-sdk';

import { ActivityOperKindEnum, ActivityOperTransferType, EvmActivityAsset, EvmOperation } from 'lib/activity/types';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';

export function parseTransfer(transfer: AssetTransfersWithMetadataResult, accAddress: string): EvmOperation {
  const fromAddress = transfer.from;
  const toAddress = transfer.to;

  if (!fromAddress || !toAddress) return buildInteraction(transfer, accAddress);

  const contractAddress = transfer.rawContract.address;

  // TODO: to/from contract/account recognition
  const type = fromAddress === accAddress ? ActivityOperTransferType.send : ActivityOperTransferType.receive;

  if (transfer.category === AssetTransfersCategory.EXTERNAL) {
    // fromAddress is an account's address for 'external' transfers
    const type = toAddress === accAddress ? ActivityOperTransferType.receiveFromAccount : ActivityOperTransferType.send;

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
      asset
    };
  }

  if (transfer.category === AssetTransfersCategory.INTERNAL) {
    // fromAddress is contract address for 'internal' transfers
    const type = toAddress === accAddress ? ActivityOperTransferType.receive : ActivityOperTransferType.send;

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
      asset
    };
  }

  if (transfer.category === AssetTransfersCategory.ERC721) {
    if (!contractAddress) return buildInteraction(transfer, accAddress);

    const tokenId = transfer.erc721TokenId;

    const asset: EvmActivityAsset = {
      contract: contractAddress,
      tokenId: tokenId ? hexToStringInteger(tokenId) : undefined,
      amountSigned: fromAddress === accAddress ? '-1' : '1',
      symbol: transfer.asset ?? undefined,
      decimals: 0,
      nft: true
    };

    return {
      kind: ActivityOperKindEnum.transfer,
      type,
      fromAddress,
      toAddress,
      asset
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
      nft: true
    };

    return {
      kind: ActivityOperKindEnum.transfer,
      type,
      fromAddress,
      toAddress,
      asset
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
      decimals: decimal ? Number(decimal) : undefined
    };

    return {
      kind: ActivityOperKindEnum.transfer,
      type,
      fromAddress,
      toAddress,
      asset
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
      nft: true
    };

    return {
      kind: ActivityOperKindEnum.transfer,
      type,
      fromAddress,
      toAddress,
      asset
    };
  }

  return buildInteraction(transfer, accAddress);
}

function buildInteraction(transfer: AssetTransfersWithMetadataResult, accAddress: string): EvmOperation {
  const withAddress = transfer.from === accAddress ? transfer.to ?? undefined : transfer.from;

  return { kind: ActivityOperKindEnum.interaction, withAddress };
}

function hexToStringInteger(hex: string) {
  return BigInt(hex).toString();
}
