import * as Repo from '../repo';

const isPendingOperationOutdated = (addedAt: number) => {
  const MAX_PENDING_OPERATION_DISPLAY_TIME = 4 * 3600000;

  const currentTime = new Date().getTime();

  return currentTime - addedAt > MAX_PENDING_OPERATION_DISPLAY_TIME;
};

export const deletePendingOp = async () => {
  const opToDelete = Repo.operations.filter(o => {
    const explorerStatus = o.data.tzktGroup?.[0]?.status ?? o.data.bcdTokenTransfers?.[0]?.status;

    return !explorerStatus && isPendingOperationOutdated(o.addedAt);
  });

  const arrayOpToDelete = await opToDelete.toArray();

  arrayOpToDelete.forEach(o => {
    Repo.operations.where('hash').equals(o.hash).delete();
  });
};
