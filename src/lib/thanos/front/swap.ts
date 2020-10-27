import BigNumber from "bignumber.js";
import { mutezToTz } from "lib/thanos/helpers";

interface SwapBase {
	type: "xtzToToken" | "tokenToXtz" | "tokenToToken"
};

export interface XTZToTokenSwap extends SwapBase {
	type: "xtzToToken";
	xtzAmount: BigNumber;
	tokenOutAmount: BigNumber;
	contractOutAddress: string;
}

export interface TokenToXTZSwap extends SwapBase {
	type: "tokenToXtz";
	xtzAmount: BigNumber;
	tokenInAddress: string;
	tokenInAmount: BigNumber;
}

export interface TokenToTokenSwap extends SwapBase {
	type: "tokenToToken";
	tokenInAddress: string;
	tokenInAmount: BigNumber;
	contractOutAddress: string;
	tokenOutAmount: BigNumber;
}

export interface ContractStorage {
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
		},
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
	}
}

export type Swap = XTZToTokenSwap | TokenToXTZSwap | TokenToTokenSwap;

export function tryParseUseOperation(operation: any) {
	return {
		rawXtzAmount: operation.amount,
		contractAddress: operation.to,
		args: operation.parameter?.value?.args?.[1]
			?.args?.[0]?.args?.[0]?.args?.[0]?.args?.[0]?.args
	};
}

export function tryParseApproveOperation(operation: any) {
	return {
		rawXtzAmount: operation.amount,
		tokenAddress: operation.to,
		tokenAmount: operation.parameter?.value?.args?.[1]?.int
	};
}

export function tryParseSwapOperations(operations: any[]): Swap | undefined {
	if (!operations.every(operation => typeof operation === "object")) {
		return undefined;
	}

	if (operations.length === 1) {
		const operation = operations[0];
		if (operation.parameter?.entrypoint !== "use") {
			return undefined;
		}
		const { rawXtzAmount, contractAddress: contractOutAddress, args } = tryParseUseOperation(operation);
		const rawTokenAmount = args?.[0]?.int;
		if (typeof rawXtzAmount !== "number" ||
			typeof rawTokenAmount !== "string" ||
			typeof contractOutAddress !== "string") {
			return undefined;
		}
		return {
			type: "xtzToToken",
			xtzAmount: operation.mutez === false
				? new BigNumber(rawXtzAmount)
				: mutezToTz(new BigNumber(rawXtzAmount)),
			tokenOutAmount: new BigNumber(rawTokenAmount).plus(1),
			contractOutAddress
		};
	}
	if (operations.length === 2) {
		const [swapApproveOperation, useOperation] = operations;
		if (swapApproveOperation.parameter?.entrypoint !== "approve"
			|| useOperation.parameter?.entrypoint !== "use") {
			return undefined;
		}
		const { tokenAddress, tokenAmount: rawTokenAmount } = tryParseApproveOperation(swapApproveOperation);
		const { args } = tryParseUseOperation(useOperation);
		const rawXtzAmount = args?.[0]?.args?.[1]?.int;
		if ([tokenAddress, rawTokenAmount, rawXtzAmount].some(value => typeof value !== "string")) {
			return undefined;
		}

		return {
			type: "tokenToXtz",
			tokenInAddress: tokenAddress,
			xtzAmount: swapApproveOperation.mutez === false
				? new BigNumber(rawXtzAmount)
				: mutezToTz(new BigNumber(rawXtzAmount)),
			tokenInAmount: new BigNumber(rawTokenAmount)
		};
	}
	if (operations.length === 3) {
		const [approveOperation, useOperationIn, useOperationOut] = operations;
		if (approveOperation.parameter?.entrypoint !== "approve"
			|| useOperationIn.parameter?.entrypoint !== "use"
			|| useOperationOut.parameter?.entrypoint !== "use") {
			return undefined;
		}
		console.log(approveOperation, useOperationIn, useOperationOut);
		const {
			tokenAddress: tokenInAddress,
			tokenAmount: rawTokenInAmount
		} = tryParseApproveOperation(approveOperation);
		const { args, contractAddress: contractOutAddress } = tryParseUseOperation(useOperationOut);
		const rawTokenOutAmount = args?.[0]?.int;

		if ([tokenInAddress, rawTokenInAmount, contractOutAddress, rawTokenOutAmount].some(value => typeof value !== "string")) {
			return undefined;
		}

		return {
			type: "tokenToToken",
			tokenInAddress,
			tokenInAmount: new BigNumber(rawTokenInAmount),
			contractOutAddress,
			tokenOutAmount: new BigNumber(rawTokenOutAmount).plus(1)
		};
	}
	return undefined;
}
