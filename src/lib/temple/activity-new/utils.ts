import type { TzktOperation } from 'lib/tzkt/types';

////

export interface OperGroup {
  hash: string;
  operations: TzktOperation[];
}

type ActivityStatus = TzktOperation['status'] | 'pending';

export interface Activity {
  hash: string;
  addedAt: string; // : ISO string
  status: ActivityStatus;
  /** Sorted new-to-old */
  tzktOperations: TzktOperation[];
}

////
export function operGroupToActivity({ hash, operations }: OperGroup): Activity {
  const firstOperation = operations[0]!;
  const addedAt = firstOperation.timestamp;
  const status = firstOperation.status;

  return {
    hash,
    addedAt,
    status,
    tzktOperations: operations
  };
}
