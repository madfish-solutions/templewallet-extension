import { isDefined } from '@rnw-community/shared';
import { omit } from 'lodash';
import { getAddress } from 'viem';

import { EvmActivity, EvmActivityAsset, EvmOperation } from 'lib/activity';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';

import { DbEvmActivity, DbEvmActivityAsset, NO_TOKEN_ID_VALUE } from '../db';

export const toFrontEvmActivity = (
  { account, contract, operations, blockHeight, id, ...activity }: DbEvmActivity,
  assets: Partial<Record<number, DbEvmActivityAsset>>
): EvmActivity => {
  return {
    ...activity,
    operations: operations.map(({ fkAsset, amountSigned, ...operation }) => {
      const dbAsset = isDefined(fkAsset) ? assets[fkAsset] : undefined;

      const asset: EvmActivityAsset | undefined = dbAsset
        ? Object.assign(omit(dbAsset, 'tokenId', 'id', 'chainId'), {
            contract: dbAsset.contract === EVM_TOKEN_SLUG ? dbAsset.contract : getAddress(dbAsset.contract),
            amountSigned,
            tokenId: dbAsset.tokenId === NO_TOKEN_ID_VALUE ? undefined : dbAsset.tokenId
          })
        : undefined;

      return {
        ...operation,
        asset
      } as EvmOperation;
    }),
    blockHeight: `${blockHeight}`
  };
};
