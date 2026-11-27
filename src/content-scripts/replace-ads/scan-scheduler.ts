export interface AdsScanRequest {
  roots?: HTMLElement[];
}

export interface AdsScanScheduler {
  request: (root?: HTMLElement, delay?: number) => void;
  dispose: () => void;
}

const FALLBACK_INTERVAL = 25_000;
const MAX_DIRTY_ROOTS = 50;

export const createAdsScanScheduler = (
  scan: (request: AdsScanRequest) => Promise<void>,
  onError: (error: unknown) => void,
  ownerDocument: Document = document
): AdsScanScheduler => {
  let disposed = false;
  let active = false;
  let dirty = false;
  let fullScan = false;
  let roots: HTMLElement[] = [];
  let timer: ReturnType<typeof setTimeout> | undefined;
  let dueAt = Infinity;

  const schedule = (delay: number) => {
    if (disposed || active || ownerDocument.visibilityState === 'hidden') return;
    const nextDueAt = Date.now() + delay;
    if (timer && dueAt <= nextDueAt) return;
    if (timer) clearTimeout(timer);
    dueAt = nextDueAt;
    timer = setTimeout(() => void run(), delay);
  };

  const request = (root?: HTMLElement, delay = 40) => {
    if (disposed) return;
    dirty = true;
    if (!root || roots.length >= MAX_DIRTY_ROOTS) {
      fullScan = true;
      roots = [];
    } else if (!fullScan && !roots.some(existing => existing.contains(root))) {
      roots = roots.filter(existing => !root.contains(existing));
      roots.push(root);
    }
    schedule(delay);
  };

  const run = async () => {
    timer = undefined;
    dueAt = Infinity;
    if (disposed || active || !dirty || ownerDocument.visibilityState === 'hidden') return;
    const requestRoots = fullScan ? undefined : roots.filter(root => root.isConnected);
    dirty = false;
    fullScan = false;
    roots = [];
    active = true;
    try {
      await scan({ roots: requestRoots });
    } catch (error) {
      onError(error);
    } finally {
      active = false;
      if (dirty) schedule(40);
    }
  };

  const onVisibilityChange = () => {
    if (ownerDocument.visibilityState === 'hidden') {
      if (timer) clearTimeout(timer);
      timer = undefined;
      dueAt = Infinity;
    } else {
      request();
    }
  };
  ownerDocument.addEventListener('visibilitychange', onVisibilityChange);
  const fallback = setInterval(() => request(undefined, 0), FALLBACK_INTERVAL);
  request(undefined, 50);

  return {
    request,
    dispose: () => {
      disposed = true;
      if (timer) clearTimeout(timer);
      clearInterval(fallback);
      ownerDocument.removeEventListener('visibilitychange', onVisibilityChange);
      roots = [];
      dirty = false;
    }
  };
};

const isOwnedNode = (node: Node): boolean => {
  const element = node instanceof Element ? node : node.parentElement;
  return Boolean(element?.closest('[twa]'));
};

export const getPublisherMutationRoots = (mutations: MutationRecord[]): HTMLElement[] => {
  const roots = new Set<HTMLElement>();
  for (const mutation of mutations) {
    if (isOwnedNode(mutation.target)) continue;
    if (mutation.type === 'attributes') {
      if (mutation.target instanceof HTMLElement) roots.add(mutation.target);
      continue;
    }
    const publisherNodes = [...mutation.addedNodes, ...mutation.removedNodes].filter(node => !isOwnedNode(node));
    if (publisherNodes.length === 0) continue;
    if (mutation.target instanceof HTMLElement) roots.add(mutation.target);
    else {
      for (const node of publisherNodes) {
        if (node instanceof HTMLElement && node.isConnected) roots.add(node);
      }
    }
  }
  return [...roots];
};

export const publisherMutationDelay = (roots: HTMLElement[]): number => {
  for (const root of roots.slice(0, 20)) {
    const rect = root.getBoundingClientRect();
    if (rect.bottom >= -200 && rect.top <= window.innerHeight + 200) return 40;
  }
  return 700;
};
