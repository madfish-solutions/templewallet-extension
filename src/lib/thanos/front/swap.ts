import BigNumber from "bignumber.js";
import * as React from "react";
import { mutezToTz } from "lib/thanos/helpers";
import { useAssets } from "./assets";
import { useTezos } from "./ready";
import { ThanosAssetType, ThanosToken } from "../types";
import { useRetryableSWR } from "lib/swr";

function tryParseUseOperation(operation: any) {
	let args = operation.parameter?.value?.args?.[1].args;
	console.log(args);
	while (args?.[0]?.prim) {
		args = args?.[0]?.args;
		console.log(args);
	}
	console.log(args);

  return {
    rawXtzAmount: operation.amount,
    contractAddress: operation.to,
    args,
  };
}

function tryParseApproveOperation(operation: any) {
  return {
    rawXtzAmount: operation.amount,
    tokenAddress: operation.to,
    tokenAmount: operation.parameter?.value?.args?.[1]?.int,
  };
}

interface SwapBase {
  type: "xtzToToken" | "tokenToXtz" | "tokenToToken";
}

interface RawXTZToTokenSwap extends SwapBase {
  type: "xtzToToken";
  xtzAmount: BigNumber;
  tokenOutAmount: BigNumber;
  contractOutAddress: string;
}

export interface RawTokenToXTZSwap extends SwapBase {
  type: "tokenToXtz";
  xtzAmount: BigNumber;
  tokenInAddress: string;
  tokenInAmount: BigNumber;
}

interface RawTokenToTokenSwap extends SwapBase {
  type: "tokenToToken";
  tokenInAddress: string;
  tokenInAmount: BigNumber;
  contractOutAddress: string;
  tokenOutAmount: BigNumber;
}

type RawSwap = RawXTZToTokenSwap | RawTokenToXTZSwap | RawTokenToTokenSwap;

function tryParseSwapOperations(operations: any[]): RawSwap | undefined {
  if (!operations.every((operation) => typeof operation === "object")) {
    return undefined;
  }

  if (operations.length === 1) {
    const operation = operations[0];
    if (operation.parameter?.entrypoint !== "use") {
      return undefined;
    }
    const {
      rawXtzAmount,
      contractAddress: contractOutAddress,
      args,
    } = tryParseUseOperation(operation);
    const rawTokenAmount = args?.[0]?.int;
    console.log(rawXtzAmount, contractOutAddress, args);
    if (
      typeof rawXtzAmount !== "number" ||
      typeof rawTokenAmount !== "string" ||
      typeof contractOutAddress !== "string"
    ) {
      return undefined;
    }
    return {
      type: "xtzToToken",
      xtzAmount:
        operation.mutez === false
          ? new BigNumber(rawXtzAmount)
          : mutezToTz(new BigNumber(rawXtzAmount)),
      tokenOutAmount: new BigNumber(rawTokenAmount).plus(1),
      contractOutAddress,
    };
  }
  if (operations.length === 2) {
    const [swapApproveOperation, useOperation] = operations;
    if (
      swapApproveOperation.parameter?.entrypoint !== "approve" ||
      useOperation.parameter?.entrypoint !== "use"
    ) {
      return undefined;
    }
    const {
      tokenAddress,
      tokenAmount: rawTokenAmount,
    } = tryParseApproveOperation(swapApproveOperation);
    const { args } = tryParseUseOperation(useOperation);
    const rawXtzAmount = args?.[1]?.int;
    if (
      [tokenAddress, rawTokenAmount, rawXtzAmount].some(
        (value) => typeof value !== "string"
      )
    ) {
      return undefined;
    }

    return {
      type: "tokenToXtz",
      tokenInAddress: tokenAddress,
      xtzAmount:
        swapApproveOperation.mutez === false
          ? new BigNumber(rawXtzAmount)
          : mutezToTz(new BigNumber(rawXtzAmount)),
      tokenInAmount: new BigNumber(rawTokenAmount),
    };
  }
  if (operations.length === 3) {
    const [approveOperation, useOperationIn, useOperationOut] = operations;
    if (
      approveOperation.parameter?.entrypoint !== "approve" ||
      useOperationIn.parameter?.entrypoint !== "use" ||
      useOperationOut.parameter?.entrypoint !== "use"
    ) {
      return undefined;
    }
    const {
      tokenAddress: tokenInAddress,
      tokenAmount: rawTokenInAmount,
    } = tryParseApproveOperation(approveOperation);
    const { args, contractAddress: contractOutAddress } = tryParseUseOperation(
      useOperationOut
    );
    const rawTokenOutAmount = args?.[0]?.int;

    if (
      [
        tokenInAddress,
        rawTokenInAmount,
        contractOutAddress,
        rawTokenOutAmount,
      ].some((value) => typeof value !== "string")
    ) {
      return undefined;
    }

    return {
      type: "tokenToToken",
      tokenInAddress,
      tokenInAmount: new BigNumber(rawTokenInAmount),
      contractOutAddress,
      tokenOutAmount: new BigNumber(rawTokenOutAmount).plus(1),
    };
  }
  return undefined;
}

interface ContractStorage {
  lambdas: string;
  storage: {
    currentCycle: {
      counter: string;
      cycleCoefficient: string;
      lastUpdate: string;
      nextCycle: string;
      reward: string;
      start: string;
      totalLoyalty: string;
    };
    currentDelegated: string;
    cycles: string;
    delegated: string;
    factoryAddress: string;
    feeRate: string;
    invariant: string;
    loyaltyCycle: string;
    shares: string;
    tezPool: string;
    tokenAddress: string;
    tokenPool: string;
    totalShares: string;
    totalVotes: string;
    veto: string;
    vetoVoters: string;
    vetos: string;
    voters: string;
    votes: string;
  };
}

export type XTZToTokenSwap = Omit<RawXTZToTokenSwap, "contractOutAddress"> & {
  tokenOut: ThanosToken | string;
};
export type TokenToTokenSwap = Omit<
  RawTokenToTokenSwap,
  "contractOutAddress" | "tokenInAddress"
> & {
  tokenIn: ThanosToken | string;
  tokenOut: ThanosToken | string;
};
export type TokenToXTZSwap = Omit<RawTokenToXTZSwap, "tokenInAddress"> & {
  tokenIn: ThanosToken | string;
};
export type Swap = XTZToTokenSwap | TokenToXTZSwap | TokenToTokenSwap;

export function useSwapData(operations: any[]): Swap | undefined {
  const { allAssets } = useAssets();
  const tezos = useTezos();
  const parsedData = React.useMemo(() => tryParseSwapOperations(operations), [
    operations,
  ]);

  const getContractStorage = React.useCallback(
    async (_k: string, _checksum: string, contractAddress: string) => {
      if (!contractAddress) {
        return null;
      }
      const contract = await tezos.contract.at(contractAddress);
      const storage = await contract.storage<ContractStorage>();
      return storage;
    },
    [tezos]
  );
  const findAsset = React.useCallback(
    (address?: string) => {
      return allAssets.find(
        (asset) =>
          asset.type !== ThanosAssetType.XTZ && asset.address === address
      ) as ThanosToken | undefined;
    },
    [allAssets]
  );
  const contractOutAddress = React.useMemo(() => {
    if (!parsedData || parsedData.type === "tokenToXtz") {
      return undefined;
    }
    return parsedData.contractOutAddress;
  }, [parsedData]);
  const { data: storage } = useRetryableSWR(
    ["get-contract-storage", tezos.checksum, contractOutAddress],
    getContractStorage,
    { suspense: true }
  );
  const tokenOutAddress = storage?.storage.tokenAddress;
  const outAsset = React.useMemo(() => findAsset(tokenOutAddress), [
    findAsset,
    tokenOutAddress,
  ]);
  const inAsset = React.useMemo(
    () =>
      !parsedData || parsedData.type === "xtzToToken"
        ? undefined
        : findAsset(parsedData.tokenInAddress),
    [parsedData, findAsset]
  );
  const ultimateSwapData = React.useMemo(() => {
    if (!parsedData) {
      return undefined;
    }
    const outAssetDecimals = outAsset?.decimals ?? 0;
    const inAssetDecimals = inAsset?.decimals ?? 0;
    if (parsedData.type === "xtzToToken") {
      const { contractOutAddress, tokenOutAmount, ...restProps } = parsedData;
      return {
        tokenOut: outAsset || tokenOutAddress!,
        tokenOutAmount: tokenOutAmount.div(10 ** outAssetDecimals),
        ...restProps,
      };
    }
    if (parsedData.type === "tokenToToken") {
      const {
        contractOutAddress,
        tokenOutAmount,
        tokenInAmount,
        tokenInAddress,
        ...restProps
      } = parsedData;
      return {
        tokenOut: outAsset || tokenOutAddress!,
        tokenOutAmount: tokenOutAmount.div(10 ** outAssetDecimals),
        tokenInAmount: tokenInAmount.div(10 ** inAssetDecimals),
        tokenIn: inAsset || parsedData.tokenInAddress,
        ...restProps,
      };
    }

    const { tokenInAmount, tokenInAddress, ...restProps } = parsedData;
    return {
      tokenIn: inAsset || tokenInAddress,
      tokenInAmount: tokenInAmount.div(10 ** inAssetDecimals),
      ...restProps,
    };
  }, [parsedData, inAsset, outAsset, tokenOutAddress]);

  return ultimateSwapData;
}
