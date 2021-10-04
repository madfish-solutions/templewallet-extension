import {useEffect, useMemo, useState} from "react";

import {TezosToolkit} from "@taquito/taquito";
import BigNumber from "bignumber.js";
import debouncePromise from "debounce-promise";

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

    const calculatePriceImpactWithDebounce = useMemo(() => debouncePromise(async (
        tezosParam: TezosToolkit,
        selectedExchangerParam: ExchangerType,
        inputContractAddressParam?: string,
        outputContractAddressParam?: string,
        inputAmountParam?: BigNumber,
        outputAmountParam?: BigNumber,
        feePercentageParam?: BigNumber,
        inputAssetParam?: TempleAsset,
        outputAssetParam?: TempleAsset
    ) => {
        if (
            feePercentageParam !== undefined &&
            inputAmountParam !== undefined &&
            outputAmountParam !== undefined &&
            inputAssetParam !== undefined &&
            outputAssetParam !== undefined) {

            const thousand = new BigNumber(1000);
            const normalizedFee = thousand.minus(feePercentageParam.multipliedBy(new BigNumber(10))).dividedBy(thousand);

            const inputAtomsAmount = tokensToAtoms(inputAmountParam, inputAssetParam.decimals);
            const inputAtomsAmountWithFee = inputAtomsAmount.multipliedBy(normalizedFee);

            const outputAtomsAmount = tokensToAtoms(outputAmountParam, outputAssetParam.decimals);

            const marketPrice = await getMarketPrice(tezosParam, selectedExchangerParam, inputContractAddressParam, outputContractAddressParam);

            const priceImpact = getPriceImpact(inputAtomsAmountWithFee, outputAtomsAmount, marketPrice);

            setPriceImpact(priceImpact);
        } else {
            setPriceImpact(new BigNumber(0));
        }
    }, 350), [setPriceImpact]);

    useEffect(() => void calculatePriceImpactWithDebounce(tezos, selectedExchanger, inputContractAddress, outputContractAddress, inputAmount, outputAmount, feePercentage, inputAsset, outputAsset), [calculatePriceImpactWithDebounce, tezos, selectedExchanger, inputContractAddress, outputContractAddress, inputAmount, outputAmount, feePercentage, inputAsset, outputAsset])

    return priceImpact;
}
