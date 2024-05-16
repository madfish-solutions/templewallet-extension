import { TezosToolkit } from '@taquito/taquito';
import BigNumber from 'bignumber.js';
import { parseAbi } from 'viem';

import { fromAssetSlug, isFA2Token, TEZ_TOKEN_SLUG } from 'lib/assets';
import { fromAssetSlugWithStandardDetect } from 'lib/assets/contract.utils';
import { loadContract } from 'lib/temple/contract';
import { ZERO } from 'lib/utils/numbers';
import { getReadOnlyEvmForNetwork } from 'temple/evm';
import { EvmChain } from 'temple/front';

export const fetchRawBalance = async (tezos: TezosToolkit, assetSlug: string, account: string) => {
  const asset = await fromAssetSlugWithStandardDetect(tezos, assetSlug);

  if (asset === TEZ_TOKEN_SLUG)
    return await tezos.tz.getBalance(account).then(toSafeBignum, error => {
      console.error(error);

      return ZERO;
    });

  let nat = ZERO;

  const contract = await loadContract(tezos, asset.contract, false);

  if (isFA2Token(asset)) {
    try {
      const response = await contract.views.balance_of([{ owner: account, token_id: asset.id }]).read();
      nat = response[0].balance;
    } catch {}
  } else {
    try {
      nat = await contract.views.getBalance(account).read();
    } catch {}
  }

  return toSafeBignum(nat);
};

export const fetchEvmRawBalance = async (network: EvmChain, assetSlug: string, account: HexString) => {
  const [contractAddress, tokenIdStr] = fromAssetSlug<HexString>(assetSlug);

  const tokenId = BigInt(tokenIdStr ?? 0);

  const publicClient = getReadOnlyEvmForNetwork(network);

  let balance = ZERO;

  try {
    const fetchedBalance = await publicClient.readContract({
      address: contractAddress,
      abi: parseAbi(['function balanceOf(address owner) view returns (uint256)']),
      functionName: 'balanceOf',
      args: [account]
    });

    try {
      const ownerAddress = await publicClient.readContract({
        address: contractAddress,
        abi: parseAbi(['function ownerOf(uint256 tokenId) view returns (address owner)']),
        functionName: 'ownerOf',
        args: [tokenId]
      });

      if (ownerAddress === account) balance = new BigNumber(1);
    } catch {
      balance = BigNumber(fetchedBalance.toString());
    }
  } catch {
    try {
      const fetchedErc1155Balance = await publicClient.readContract({
        address: contractAddress,
        abi: parseAbi(['function balanceOf(address account, uint256 id) view returns (uint256)']),
        functionName: 'balanceOf',
        args: [account, tokenId]
      });

      balance = new BigNumber(fetchedErc1155Balance.toString());
    } catch {
      console.error('Failed to fetch chain balance for: ', assetSlug);
    }
  }

  return balance;
};

const toSafeBignum = (x: any): BigNumber =>
  !x || (typeof x === 'object' && typeof x.isNaN === 'function' && x.isNaN()) ? ZERO : new BigNumber(x);
