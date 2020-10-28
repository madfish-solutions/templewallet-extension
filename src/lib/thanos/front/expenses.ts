import BigNumber from "bignumber.js";
import { OperationsPreview } from "lib/thanos/front";

export type RawOperationAssetExpense = {
  tokenAddress?: string;
  amount: BigNumber;
};
export type RawOperationExpenses = {
	type: string;
	isEntrypointInteraction: boolean;
  expenses: RawOperationAssetExpense[];
};

export function tryParseExpenses(
  operations: OperationsPreview,
  accountAddress: string
): RawOperationExpenses[] {
  const operationsAsArray =
    operations instanceof Array ? operations : operations.contents;
  return operationsAsArray
    .map((operation) => {
      const { kind, source: from, amount } = operation;
      const entrypoint = operation.parameter?.entrypoint;
			const type = entrypoint || kind;
			const isEntrypointInteraction = !!entrypoint;
      if (!kind) {
        return undefined;
      }
      if (from && from !== accountAddress) {
        return {
					type,
					isEntrypointInteraction,
          expenses: [],
        };
      }
      const expenses: RawOperationAssetExpense[] = [];
      if (amount) {
        expenses.push({ amount: new BigNumber(amount) });
      }
      if (["transfer", "approve"].includes(type)) {
        const tokenAddress = operation.to;
        let args = operation.parameter?.value?.args;
        while (args?.[0]?.prim) {
          args = args?.[0]?.args;
        }
        const to = args?.[0]?.string;
        const amount = args?.[1]?.int;
        if (
          [tokenAddress, to, amount].every((value) => typeof value === "string")
        ) {
          expenses.push({
            tokenAddress,
            amount: new BigNumber(amount),
          });
        }
      }

      return {
				type,
				isEntrypointInteraction,
        expenses,
      };
    })
    .filter((x): x is RawOperationExpenses => !!x);
}
