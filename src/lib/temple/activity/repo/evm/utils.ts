import { isDefined } from '@rnw-community/shared';
import { omit } from 'lodash';
import { getAddress } from 'viem';

import { EvmActivity, EvmActivityAsset, EvmOperation } from 'lib/activity';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { equalsIgnoreCase } from 'lib/evm/on-chain/utils/common.utils';
import { filterUnique } from 'lib/utils';

import { DbEvmActivity, DbEvmActivityAsset, NO_TOKEN_ID_VALUE, evmActivityAssets } from '../db';

type IdsToAssets = Partial<Record<number, DbEvmActivityAsset>>;

export const toFrontEvmActivity = (
  { account, contract, operations, blockHeight, id, ...activity }: DbEvmActivity,
  assets: IdsToAssets
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

export const toFrontEvmActivities = (
  rawActivities: DbEvmActivity[],
  idsToAssets: IdsToAssets,
  contractAddress?: string
) =>
  rawActivities
    .map(activity => {
      if (!contractAddress) {
        return toFrontEvmActivity(activity, idsToAssets);
      }

      const { operations, ...restProps } = toFrontEvmActivity(activity, idsToAssets);

      return {
        ...restProps,
        operations: operations.filter(operation => equalsIgnoreCase(operation.asset?.contract, contractAddress))
      };
    })
    .filter(({ operations }) => operations.length > 0);

export const getRelevantAssets = async (activities: DbEvmActivity[]): Promise<IdsToAssets> => {
  const assetsIds = filterUnique(
    activities
      .map(({ operations }) => operations.map(({ fkAsset }) => fkAsset))
      .flat()
      .filter(isDefined)
  );
  const assets = await evmActivityAssets.bulkGet(assetsIds);

  return Object.fromEntries(assets.map((asset, i) => [assetsIds[i], asset]));
};
