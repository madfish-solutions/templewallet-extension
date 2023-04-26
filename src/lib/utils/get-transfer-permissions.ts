import { TezosToolkit, TransferParams } from '@taquito/taquito';
import BigNumber from 'bignumber.js';

import { tokensToAtoms } from 'lib/temple/helpers';

interface TokenToSpend {
  contract: string | null;
  tokenId: string | number | null;
  standard: 'fa12' | 'fa2' | 'xtz';
  decimals: number;
}

export const getTransferPermissions = async (
  tezos: TezosToolkit,
  spender: string,
  owner: string,
  tokenToSpend: TokenToSpend,
  amount: BigNumber
) => {
  const permissions: { approve: Array<TransferParams>; revoke: Array<TransferParams> } = {
    approve: [],
    revoke: []
  };

  if (!tokenToSpend.contract) {
    return permissions;
  }

  const assetContract = await tezos.wallet.at(tokenToSpend.contract);
  if (tokenToSpend.standard === 'fa12') {
    const reset = assetContract.methods.approve(spender, new BigNumber(0)).toTransferParams({ mutez: true });
    const spend = assetContract.methods
      .approve(spender, tokensToAtoms(amount, tokenToSpend.decimals))
      .toTransferParams({ mutez: true });
    permissions.approve.push(reset);
    permissions.approve.push(spend);
  } else {
    const spend = assetContract.methods
      .update_operators([
        {
          add_operator: {
            owner,
            operator: spender,
            token_id: tokenToSpend.tokenId
          }
        }
      ])
      .toTransferParams({ mutez: true });
    const reset = assetContract.methods
      .update_operators([
        {
          remove_operator: {
            owner,
            operator: spender,
            token_id: tokenToSpend.tokenId
          }
        }
      ])
      .toTransferParams({ mutez: true });

    permissions.approve.push(spend);
    permissions.revoke.push(reset);
  }

  return permissions;
};
