import {useEffect, useState} from "react";

import {TezosToolkit} from "@taquito/taquito";
import BigNumber from "bignumber.js";

import {ExchangerType, getPoolParameters, TempleAsset, tokensToAtoms} from "../../lib/temple/front";


export const usePriceImpact = (tezos: TezosToolkit,
                               selectedExchanger: ExchangerType,
                               inputContractAddress?: string,
                               outputContractAddress?: string,
                               inputAssetAmount?: BigNumber,
                               outputAssetAmount?: BigNumber,
                               inputAsset?: TempleAsset,
                               outputAsset?: TempleAsset) => {

    const [priceImpact, setPriceImpact] = useState(new BigNumber(0));

    useEffect(() => {
        (async () => {
            let marketPrice, newPrice;

            if (
                inputAssetAmount !== undefined &&
                outputAssetAmount !== undefined &&
                inputAsset !== undefined &&
                outputAsset !== undefined) {

                const inputAtomsAmount = tokensToAtoms(inputAssetAmount, inputAsset.decimals);
                const outputAtomsAmount = tokensToAtoms(outputAssetAmount, outputAsset.decimals);

                const calculateMarketPrice = (inputPool: BigNumber, outputPool: BigNumber) => inputPool.div(outputPool);
                const calculateNewPrice = (inputPool: BigNumber,
                                           outputPool: BigNumber,
                                           inputAtomsAmount: BigNumber,
                                           outputAtomsAmount: BigNumber) => (inputPool.plus(inputAtomsAmount)).div(outputPool.minus(outputAtomsAmount));

                if (inputContractAddress !== undefined && outputContractAddress === undefined) {
                    const pool = await getPoolParameters(tezos, inputContractAddress, selectedExchanger);

                    marketPrice = calculateMarketPrice(pool.tokenPool, pool.xtzPool);
                    newPrice = calculateNewPrice(pool.tokenPool, pool.xtzPool, inputAtomsAmount, outputAtomsAmount);

                } else if (inputContractAddress === undefined && outputContractAddress !== undefined) {
                    const pool = await getPoolParameters(tezos, outputContractAddress, selectedExchanger);

                    marketPrice = calculateMarketPrice(pool.xtzPool, pool.tokenPool);
                    newPrice = calculateNewPrice(pool.xtzPool, pool.tokenPool, inputAtomsAmount, outputAtomsAmount);

                } else if (inputContractAddress !== undefined && outputContractAddress !== undefined) {
                    const pool1 = await getPoolParameters(tezos, inputContractAddress, selectedExchanger),
                        pool2 = await getPoolParameters(tezos, outputContractAddress, selectedExchanger);

                    marketPrice = pool1.tokenPool.div(pool1.xtzPool).multipliedBy(pool2.xtzPool.div(pool2.tokenPool));

                    newPrice = (pool1.tokenPool.plus(inputAtomsAmount)).div(pool1.xtzPool).multipliedBy(pool2.xtzPool.div(pool2.tokenPool.minus(outputAtomsAmount)));
                }

                if (newPrice !== undefined && marketPrice !== undefined) {
                    const hundred = new BigNumber(100),
                        result = hundred.minus(hundred.div(newPrice).multipliedBy(marketPrice));

                    setPriceImpact(result);
                }
            } })();
    }, [tezos, inputContractAddress, outputContractAddress, inputAssetAmount, outputAssetAmount, selectedExchanger, inputAsset, outputAsset])

    return priceImpact;
}