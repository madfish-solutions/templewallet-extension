import { cancelMetadataLoads, createMetadataLoadQueue, metadataLoadWasCancelled, noteMetadataLoad } from './load-queue';

describe('metadata load queue', () => {
  it('drops the running load and loads that were already waiting', () => {
    const queue = createMetadataLoadQueue();
    const running = noteMetadataLoad(queue);
    const waiting = noteMetadataLoad(queue);

    cancelMetadataLoads(queue);

    expect(metadataLoadWasCancelled(queue, running)).toBe(true);
    expect(metadataLoadWasCancelled(queue, waiting)).toBe(true);
    expect(metadataLoadWasCancelled(queue, noteMetadataLoad(queue))).toBe(false);
  });

  it('keeps a load that starts after a cancel when nothing was queued', () => {
    const queue = createMetadataLoadQueue();

    cancelMetadataLoads(queue);

    expect(metadataLoadWasCancelled(queue, noteMetadataLoad(queue))).toBe(false);
  });
});
