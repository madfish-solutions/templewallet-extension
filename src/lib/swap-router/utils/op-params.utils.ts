import { TezosToolkit } from '@taquito/taquito';
import { TransferParams } from '@taquito/taquito/dist/types/operations/types';

import { getLiquidityBakingTransferParams } from '../dexes/liquidity-baking/utils/transfer-params.utils';
import { getPlentyTransferParams } from '../dexes/plenty/utils/transfer-params.utils';
import { getQuipuSwapTransferParams } from '../dexes/quipu-swap/utils/transfer-params.utils';
import { DexTypeEnum } from '../enum/dex-type.enum';
import { Trade, TradeOperation } from '../interface/trade.interface';
import { getPermissionsTransferParams } from './permissions-transfer-params.utils';

const getTradeOperaitonTransferParams = async (
  tradeOperation: TradeOperation,
  senderPublicKeyHash: string,
  tezos: TezosToolkit
) => {
  switch (tradeOperation.dexType) {
    case DexTypeEnum.QuipuSwap:
      return [await getQuipuSwapTransferParams(tradeOperation, senderPublicKeyHash, tezos)];
    case DexTypeEnum.Plenty:
      return [await getPlentyTransferParams(tradeOperation, senderPublicKeyHash, tezos)];
    case DexTypeEnum.LiquidityBaking:
      return [await getLiquidityBakingTransferParams(tradeOperation, senderPublicKeyHash, tezos)];
    default:
      return [];
  }
};

export const getTradeOpParams = (trade: Trade, senderPublicKeyHash: string, tezos: TezosToolkit) =>
  Promise.all(
    trade.map(async (tradeOperation): Promise<TransferParams[]> => {
      const tradeTransferParams = await getTradeOperaitonTransferParams(tradeOperation, senderPublicKeyHash, tezos);
      const permissions = await getPermissionsTransferParams(tradeOperation, senderPublicKeyHash, tezos);

      return [...permissions.approve, ...tradeTransferParams, ...permissions.revoke];
    })
  ).then(result => result.flat());
