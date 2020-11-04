import BigNumber from "bignumber.js";
import { OperationsPreview } from "lib/thanos/front";

export type RawOperationAssetIncome = {
  tokenAddress?: string;
  amount: BigNumber;
};
export type RawOperationIncomes = {
  type: string;
  isEntrypointInteraction: boolean;
  incomes: RawOperationAssetIncome[];
};

export function tryParseIncomes(
  operations: OperationsPreview,
  accountAddress: string
): RawOperationIncomes[] {
  const operationsAsArray =
    operations instanceof Array ? operations : operations.contents;
  return operationsAsArray
    .map((operation) => {
			const { kind, amount, to } = operation;
      const entrypoint = operation.parameter?.entrypoint;
      const type = entrypoint || kind;
      const isEntrypointInteraction = !!entrypoint;
      if (!kind) {
        return undefined;
			}

			const incomes: RawOperationAssetIncome[] = [];
			if (operation.parameter) {
				console.warn("TODO: implement parsing tokens incomes");
			} else if (to === accountAddress) {
				incomes.push({ amount: new BigNumber(amount) });
			}

      return {
        type,
        isEntrypointInteraction,
        incomes,
      };
    })
    .filter((x): x is RawOperationIncomes => !!x);
}
