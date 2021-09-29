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
            if (
                inputAssetAmount !== undefined &&
                outputAssetAmount !== undefined &&
                inputAsset !== undefined &&
                outputAsset !== undefined) {

                let marketPrice, newMarketPrice;

                const inputAtomsAmount = tokensToAtoms(inputAssetAmount, inputAsset.decimals),
                    outputAtomsAmount = tokensToAtoms(outputAssetAmount, outputAsset.decimals);

                const calculateMarketPrice = (tokenPool1: BigNumber, tokenPool2: BigNumber, xtzPool1?: BigNumber, xtzPool2?: BigNumber) => {
                    if (xtzPool1 && xtzPool2) {
                        return tokenPool1.div(xtzPool1).multipliedBy(xtzPool2.div(tokenPool2));
                    }
                    return tokenPool1.div(tokenPool2);
                };


                const calculateNewMarketPrice = (tokenPool1: BigNumber,
                                                 tokenPool2: BigNumber,
                                                 inputAtomsAmount: BigNumber,
                                                 outputAtomsAmount: BigNumber,
                                                 xtzPool1?: BigNumber,
                                                 xtzPool2?: BigNumber) => {
                    if (xtzPool1 && xtzPool2) {
                        return (tokenPool1.plus(inputAtomsAmount)).div(xtzPool1).multipliedBy(xtzPool2.div(tokenPool2.minus(outputAtomsAmount)));
                    }

                    return (tokenPool1.plus(inputAtomsAmount)).div(tokenPool2.minus(outputAtomsAmount));
                };

                if (inputContractAddress !== undefined && outputContractAddress === undefined) {
                    const pool = await getPoolParameters(tezos, inputContractAddress, selectedExchanger);

                    marketPrice = calculateMarketPrice(pool.tokenPool, pool.xtzPool);
                    newMarketPrice = calculateNewMarketPrice(pool.tokenPool, pool.xtzPool, inputAtomsAmount, outputAtomsAmount);

                } else if (inputContractAddress === undefined && outputContractAddress !== undefined) {
                    const pool = await getPoolParameters(tezos, outputContractAddress, selectedExchanger);

                    marketPrice = calculateMarketPrice(pool.xtzPool, pool.tokenPool);
                    newMarketPrice = calculateNewMarketPrice(pool.xtzPool, pool.tokenPool, inputAtomsAmount, outputAtomsAmount);

                } else if (inputContractAddress !== undefined && outputContractAddress !== undefined) {
                    const pool1 = await getPoolParameters(tezos, inputContractAddress, selectedExchanger),
                        pool2 = await getPoolParameters(tezos, outputContractAddress, selectedExchanger);

                    marketPrice = calculateMarketPrice(pool1.tokenPool, pool2.tokenPool, pool1.xtzPool, pool2.xtzPool);
                    newMarketPrice = calculateNewMarketPrice(pool1.tokenPool, pool2.tokenPool, inputAtomsAmount, outputAtomsAmount, pool1.xtzPool, pool2.xtzPool);
                }

                if (newMarketPrice !== undefined && marketPrice !== undefined) {
                    const hundred = new BigNumber(100),
                        result = hundred.minus(hundred.div(newMarketPrice).multipliedBy(marketPrice));

                    setPriceImpact(result);
                }
            } })();
    }, [tezos, inputContractAddress, outputContractAddress, inputAssetAmount, outputAssetAmount, selectedExchanger, inputAsset, outputAsset])

    return priceImpact;
}