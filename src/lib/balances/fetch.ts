import { TezosToolkit } from '@taquito/taquito';
import BigNumber from 'bignumber.js';

import { isFA2Token, TEZ_TOKEN_SLUG } from 'lib/assets';
import { fromAssetSlugWithStandardDetect } from 'lib/assets/contract.utils';
import { loadContract } from 'lib/temple/contract';
import { ZERO } from 'lib/utils/numbers';

export const fetchRawBalance = async (tezos: TezosToolkit, assetSlug: string, account: string) => {
  const asset = await fromAssetSlugWithStandardDetect(tezos, assetSlug);

  if (asset === TEZ_TOKEN_SLUG)
    return await tezos.tz.getBalance(account).then(toSafeBignum, error => {
      console.error(error);

      return ZERO;
    });

  let nat = new BigNumber(0);

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

const toSafeBignum = (x: any): BigNumber =>
  !x || (typeof x === 'object' && typeof x.isNaN === 'function' && x.isNaN()) ? ZERO : new BigNumber(x);
