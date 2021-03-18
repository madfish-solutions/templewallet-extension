import BigNumber from "bignumber.js";

import { OperationsPreview } from "lib/temple/front";

export type RawOperationAssetExpense = {
  tokenAddress?: string;
  tokenId?: number;
  amount: BigNumber;
  to: string;
};
export type RawOperationExpenses = {
  amount?: number;
  delegate?: string;
  type: string;
  isEntrypointInteraction: boolean;
  contractAddress?: string;
  expenses: RawOperationAssetExpense[];
};

export function tryParseExpenses(
  operations: OperationsPreview,
  accountAddress: string
) {
  const r = tryParseExpensesPure(operations, accountAddress);
  return r;
}

export function tryParseExpensesPure(
  operations: OperationsPreview,
  accountAddress: string
): RawOperationExpenses[] {
  const operationsAsArray = Array.isArray(operations)
    ? operations
    : operations.contents;
  return (Array.isArray(operationsAsArray) ? operationsAsArray : [])
    .map<RawOperationExpenses | undefined>((operation) => {
      if (operation.destination) {
        operation = { ...operation, to: operation.destination };
      }

      const { kind, source: from, to, amount } = operation;
      const entrypoint = getParameters(operation)?.entrypoint;
      const type = entrypoint || kind;
      const isEntrypointInteraction = !!entrypoint;
      const parsedAmount = amount !== undefined ? Number(amount) : undefined;
      if (!kind) {
        return undefined;
      }
      if (kind === "delegation") {
        return {
          amount: 0,
          delegate: operation.delegate,
          type,
          isEntrypointInteraction: false,
          expenses: [],
        };
      }
      if (from && from !== accountAddress) {
        return {
          amount: parsedAmount,
          type,
          isEntrypointInteraction,
          expenses: [],
        };
      }
      const expenses: RawOperationAssetExpense[] = [];
      if (amount) {
        expenses.push({ amount: new BigNumber(amount), to });
      }
      if (["transfer", "approve"].includes(type)) {
        if (
          type === "transfer" &&
          getParameters(operation)?.value instanceof Array
        ) {
          const internalTransfers = getParameters(operation).value;
          internalTransfers.forEach((transfersBatch: any) => {
            transfersBatch.args[1].forEach((transfer: any) => {
              expenses.push({
                tokenAddress: operation.to,
                amount: new BigNumber(transfer.args[1].args[1].int),
                tokenId: Number(transfer.args[1].args[0].int),
                to: transfer.args[0].string,
              });
            });
          });
        } else {
          const tokenAddress = operation.to;
          let args = getParameters(operation)?.value?.args;
          while (args?.[0]?.prim) {
            args = args?.[0]?.args;
          }
          while (args?.[1]?.prim) {
            args = args?.[1]?.args;
          }
          const to = args?.[0]?.string;
          const amount = args?.[1]?.int;
          if (
            [tokenAddress, to, amount].every(
              (value) => typeof value === "string"
            )
          ) {
            expenses.push({
              tokenAddress,
              amount: new BigNumber(amount),
              to,
            });
          }
        }
      }

      return {
        amount: parsedAmount,
        type,
        isEntrypointInteraction,
        contractAddress: isEntrypointInteraction ? to : undefined,
        expenses,
      };
    })
    .filter((x): x is RawOperationExpenses => !!x);
}

function getParameters(op: any) {
  return op?.parameters ?? op?.parameter;
}
