import {useEffect, useState} from "react";

import {TezosToolkit} from "@taquito/taquito";
import BigNumber from "bignumber.js";

import {ExchangerType, getPoolParameters, TempleAsset, tokensToAtoms} from "../../lib/temple/front";


export const usePriceImpact = (tezos: TezosToolkit, selectedExchanger: ExchangerType, inputContractAddress?: string, outputContractAddress?: string, inputAssetAmount?: BigNumber, outputAssetAmount?: BigNumber, inputAsset?: TempleAsset, outputAsset?: TempleAsset ) => {
    const [priceImpact, setPriceImpact] = useState(new BigNumber(0));

    useEffect(() => {
        ( async () => { let inputPool, outputPool, marketPrice;

            if(inputContractAddress !== undefined && outputContractAddress === undefined) {
                const pool = await getPoolParameters(tezos, inputContractAddress, selectedExchanger);

                inputPool = pool.tokenPool;
                outputPool = pool.xtzPool;

                marketPrice = inputPool.div(outputPool);

            } else if(inputContractAddress === undefined && outputContractAddress !== undefined) {
                const pool = await getPoolParameters(tezos, outputContractAddress, selectedExchanger);

                inputPool = pool.xtzPool;
                outputPool = pool.tokenPool;

                marketPrice = inputPool.div(outputPool);

            } else if(inputContractAddress !== undefined && outputContractAddress !== undefined){
                const pool1 = await getPoolParameters(tezos, inputContractAddress, selectedExchanger);
                const pool2 = await getPoolParameters(tezos, outputContractAddress, selectedExchanger);

                inputPool = pool1.tokenPool;
                outputPool = pool2.tokenPool;

                marketPrice = pool1.tokenPool.multipliedBy(pool2.xtzPool).div(pool1.xtzPool.multipliedBy(pool2.tokenPool));
                // const newPrice = inputPool.plus(inputAssetAmount).div(outputPool.minus(outputAssetAmount));

            }

            if(
                inputPool !== undefined &&
                outputPool !== undefined &&
                marketPrice !== undefined &&
                inputAssetAmount !== undefined &&
                outputAssetAmount !== undefined &&
                inputAsset !== undefined &&
                outputAsset !== undefined ) {

                const inputAtomsAmount = tokensToAtoms(inputAssetAmount, inputAsset.decimals);
                const outputAtomsAmount = tokensToAtoms(outputAssetAmount, outputAsset.decimals);
                console.log("inputPool:", inputPool.toFixed());
                console.log("outputPool:", outputPool.toFixed());

                const hundred = new BigNumber(100);

                const newPrice = inputPool.plus(inputAtomsAmount).div(outputPool.minus(outputAtomsAmount));

                const result = hundred.minus(hundred.div(newPrice).multipliedBy(marketPrice));

                console.log(result.toFixed(2));

                setPriceImpact(result);
            } })();
    }, [tezos, inputContractAddress, outputContractAddress, inputAssetAmount, outputAssetAmount, selectedExchanger, inputAsset, outputAsset])

    return priceImpact;
}