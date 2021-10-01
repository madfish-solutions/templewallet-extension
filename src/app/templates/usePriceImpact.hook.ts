import {useEffect, useState} from "react";

import {TezosToolkit} from "@taquito/taquito";
import BigNumber from "bignumber.js";

import {ExchangerType, getPoolParameters, TempleAsset, tokensToAtoms} from "../../lib/temple/front";

const getMarketPrice = async (
    tezos: TezosToolkit,
    selectedExchanger: ExchangerType,
    inputContractAddress?: string,
    outputContractAddress?: string
) => {
    if (inputContractAddress === undefined && outputContractAddress !== undefined) {
        const pool = await getPoolParameters(tezos, outputContractAddress, selectedExchanger);

        return pool.tokenPool.dividedBy(pool.xtzPool);
    } else if (inputContractAddress !== undefined && outputContractAddress === undefined) {
        const pool = await getPoolParameters(tezos, inputContractAddress, selectedExchanger);

        return pool.xtzPool.dividedBy(pool.tokenPool);
    } else if (inputContractAddress !== undefined && outputContractAddress !== undefined) {
        const pool1 = await getPoolParameters(tezos, inputContractAddress, selectedExchanger);
        const pool2 = await getPoolParameters(tezos, outputContractAddress, selectedExchanger);

        const pool1marketPrice = pool1.xtzPool.dividedBy(pool1.tokenPool);
        const pool2marketPrice = pool2.tokenPool.dividedBy(pool2.xtzPool);

        return pool1marketPrice.multipliedBy(pool2marketPrice);
    }

    return new BigNumber(0);
};

const getPriceImpact = (inputAtomsAmountWithFee: BigNumber, outputAtomsAmount: BigNumber, marketPrice: BigNumber) => {
    const linearOutputAssetAmount = inputAtomsAmountWithFee.multipliedBy(marketPrice);
    const outputDifference = linearOutputAssetAmount.minus(outputAtomsAmount);

    return new BigNumber(100).multipliedBy(outputDifference.dividedBy(linearOutputAssetAmount));
};

export const usePriceImpact = (
    tezos: TezosToolkit,
    selectedExchanger: ExchangerType,
    inputContractAddress?: string,
    outputContractAddress?: string,
    inputAmount?: BigNumber,
    outputAmount?: BigNumber,
    feePercentage?: BigNumber,
    inputAsset?: TempleAsset,
    outputAsset?: TempleAsset
) => {
    const [priceImpact, setPriceImpact] = useState(new BigNumber(0));

    useEffect(() => {
        (async () => {
            if (
                feePercentage !== undefined &&
                inputAmount !== undefined &&
                outputAmount !== undefined &&
                inputAsset !== undefined &&
                outputAsset !== undefined) {

                const thousand = new BigNumber(1000);
                const normalizedFee = thousand.minus(feePercentage.multipliedBy(new BigNumber(10))).dividedBy(thousand);

                const inputAtomsAmount = tokensToAtoms(inputAmount, inputAsset.decimals);
                const inputAtomsAmountWithFee = inputAtomsAmount.multipliedBy(normalizedFee);

                const outputAtomsAmount = tokensToAtoms(outputAmount, outputAsset.decimals);

                const marketPrice = await getMarketPrice(tezos, selectedExchanger, inputContractAddress, outputContractAddress);

                setPriceImpact(getPriceImpact(inputAtomsAmountWithFee, outputAtomsAmount, marketPrice));
            }
        })();
    }, [tezos, inputContractAddress, outputContractAddress, inputAmount, outputAmount, selectedExchanger, inputAsset, outputAsset, feePercentage])

    return priceImpact;
}