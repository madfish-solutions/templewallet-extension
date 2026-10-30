interface MetadataLoadQueue {
  nextId: number;
  oldestRunnableId: number;
}

export const createMetadataLoadQueue = (): MetadataLoadQueue => ({ nextId: 0, oldestRunnableId: 0 });

/** Ids are assigned when a load is dispatched, including loads still waiting behind the current one. */
export const noteMetadataLoad = (queue: MetadataLoadQueue) => {
  queue.nextId += 1;

  return queue.nextId;
};

/** The running load and every load already waiting are dropped. A load dispatched after this still runs. */
export const cancelMetadataLoads = (queue: MetadataLoadQueue) => {
  queue.oldestRunnableId = queue.nextId + 1;
};

export const metadataLoadWasCancelled = (queue: MetadataLoadQueue, id: number) => id < queue.oldestRunnableId;
