import { encodeFunctionData, erc20Abi, erc721Abi, parseEther, parseUnits } from 'viem';

import { erc1155Abi } from 'lib/abi/erc1155';
import { EvmAssetStandard } from 'lib/evm/types';
import { EvmAssetMetadata } from 'lib/metadata/types';
import { isEvmNativeTokenSlug } from 'lib/utils/evm.utils';

interface BasicEvmSendParams {
  to: HexString;
  value: bigint;
  data?: HexString;
}

/**
 * Builds parameters for sending a EVM token or ETH.
 * @param sender Tokens sender address.
 * @param receiver Tokens receiver address.
 * @param assetMetadata Token metadata
 * @param amount Amount to send, the default value is one 'atomic' unit.
 * @returns Parameters for sending a EVM token or ETH.
 */
export const buildBasicEvmSendParams = (
  sender: HexString,
  receiver: HexString,
  assetMetadata: EvmAssetMetadata,
  amount?: string
): BasicEvmSendParams => {
  let value = BigInt(0);
  let data: HexString | undefined;

  const atomicAmount = amount ? parseUnits(amount, assetMetadata.decimals ?? 0) : BigInt(1);
  switch (assetMetadata.standard) {
    case EvmAssetStandard.NATIVE:
      value = amount ? parseEther(amount) : BigInt(1);
      break;
    case EvmAssetStandard.ERC20:
      data = encodeFunctionData({
        abi: erc20Abi,
        args: [receiver, atomicAmount],
        functionName: 'transfer'
      });
      break;
    case EvmAssetStandard.ERC721:
      data = encodeFunctionData({
        abi: erc721Abi,
        args: [sender, receiver, BigInt(assetMetadata.tokenId)],
        functionName: 'safeTransferFrom'
      });
      break;
    case EvmAssetStandard.ERC1155:
      data = encodeFunctionData({
        abi: erc1155Abi,
        args: [sender, receiver, BigInt(assetMetadata.tokenId), atomicAmount, '0x'],
        functionName: 'safeTransferFrom'
      });
      break;
    default:
      throw new Error('Unsupported EVM token standard');
  }

  const to = isEvmNativeTokenSlug(assetMetadata.address) ? receiver : assetMetadata?.address ?? receiver;

  return { to, value, data };
};
