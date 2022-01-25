import * as Repo from '../repo';

const MAX_PENDING_OPERATION_DISPLAY_TIME = 4 * 3600000;

const isPendingOperationOutdated = (addedAt: number) => {
  const currentTime = new Date().getTime();

  return currentTime - addedAt > MAX_PENDING_OPERATION_DISPLAY_TIME;
};

export const deletePendingOp = async () => {
  const opToDelete = Repo.operations.filter(o => {
    const explorerStatus = o.data.tzktGroup?.[0]?.status ?? o.data.bcdTokenTransfers?.[0]?.status;

    return !explorerStatus && isPendingOperationOutdated(o.addedAt);
  });

  const arrayOpToDelete = await opToDelete.toArray();

  await Repo.operations.bulkDelete(arrayOpToDelete.map(o => o.hash));
};
