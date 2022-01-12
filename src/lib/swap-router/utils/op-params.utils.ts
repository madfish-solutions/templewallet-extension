import { ParamsWithKind, TezosToolkit } from '@taquito/taquito';
import { TransferParams } from '@taquito/taquito/dist/types/operations/types';

import { getPlentyTransferParams } from '../dexes/plenty/utils/transfer-params.utils';
import { getQuipuSwapTransferParams } from '../dexes/quipu-swap/utils/transfer-params.utils';
import { DexTypeEnum } from '../enum/dex-type.enum';
import { Trade } from '../interface/trade.interface';
import { parseTransferParamsToParamsWithKind } from './transfer-params.utils';

export const getTradeOpParams = (
  trade: Trade,
  senderPublicKeyHash: string,
  tezos: TezosToolkit
): Promise<ParamsWithKind[]> =>
  Promise.all(
    trade.map(async (tradeOperation): Promise<TransferParams | undefined> => {
      switch (tradeOperation.dexType) {
        case DexTypeEnum.QuipuSwap:
          return getQuipuSwapTransferParams(tradeOperation, senderPublicKeyHash, tezos);
        case DexTypeEnum.Plenty:
          return getPlentyTransferParams(tradeOperation, senderPublicKeyHash, tezos);
        case DexTypeEnum.LiquidityBaking:
          return [] as unknown as TransferParams;
        default:
          return undefined;
      }
    })
  ).then(result =>
    result
      .filter((transferParams): transferParams is TransferParams => transferParams !== undefined)
      .map(transferParams => parseTransferParamsToParamsWithKind(transferParams))
  );
