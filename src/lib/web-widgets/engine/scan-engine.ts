import { mountPill, type MountedPill } from '../pill/mount-pill';
import type { DetectorRegistry } from '../registry';
import { TWEET } from '../x-dom/selectors';

import type { DetectedRef, TagData } from './types';

const DEBOUNCE_MS = 250;
const VIEWPORT_ROOT_MARGIN = '600px';
const PROCESSED_MARKER_ATTR = 'data-tw-web-widgets';

type HistoryMethod = (data: any, unused: string, url?: string | URL | null) => void;

export class ScanEngine {
  private started = false;
  private generation = 0;

  private mutationObserver: MutationObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
  private debounceTimer: NodeJS.Timeout | null = null;

  private originalPushState: HistoryMethod | null = null;
  private originalReplaceState: HistoryMethod | null = null;

  private readonly rootsByPost = new WeakMap<HTMLElement, MountedPill[]>();
  private readonly trackedPosts = new Set<HTMLElement>();

  private readonly observedPosts = new Set<HTMLElement>();

  constructor(private readonly registry: DetectorRegistry) {}

  start(): void {
    if (this.started) return;
    this.started = true;

    this.intersectionObserver = new IntersectionObserver(entries => this.onIntersect(entries), {
      rootMargin: VIEWPORT_ROOT_MARGIN
    });

    const root = document.body ?? document.documentElement;
    this.mutationObserver = new MutationObserver(mutations => this.onMutations(mutations));
    this.mutationObserver.observe(root, { childList: true, subtree: true });

    this.patchHistory();
    window.addEventListener('popstate', this.onPopState);

    this.discover();
  }

  stop(): void {
    if (!this.started) return;
    this.started = false;

    // Invalidate every in-flight resolve()
    this.generation++;

    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    this.mutationObserver?.disconnect();
    this.mutationObserver = null;

    this.intersectionObserver?.disconnect();
    this.intersectionObserver = null;
    this.observedPosts.clear();

    window.removeEventListener('popstate', this.onPopState);
    this.restoreHistory();

    for (const post of this.trackedPosts) this.teardownPost(post);
    this.trackedPosts.clear();
  }

  private discover(): void {
    for (const post of document.querySelectorAll<HTMLElement>(TWEET)) {
      if (post.hasAttribute(PROCESSED_MARKER_ATTR)) continue;
      if (this.observedPosts.has(post)) continue;
      this.observedPosts.add(post);
      this.intersectionObserver?.observe(post);
    }
  }

  private scheduleDiscover(): void {
    if (this.debounceTimer !== null) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      if (this.started) this.discover();
    }, DEBOUNCE_MS);
  }

  private onMutations(mutations: MutationRecord[]): void {
    let sawAddition = false;

    for (const mutation of mutations) {
      for (const node of mutation.removedNodes) {
        if (!(node instanceof HTMLElement)) continue;
        this.handleRemoval(node);
      }
      if (mutation.addedNodes.length > 0) sawAddition = true;
    }

    if (sawAddition) this.scheduleDiscover();
  }

  private handleRemoval(removed: HTMLElement): void {
    if (this.trackedPosts.has(removed)) this.dropPost(removed);

    for (const post of this.trackedPosts) {
      if (removed.contains(post)) this.dropPost(post);
    }
  }

  private onIntersect(entries: IntersectionObserverEntry[]): void {
    for (const entry of entries) {
      const post = entry.target;
      if (!(post instanceof HTMLElement)) continue;
      if (!entry.isIntersecting) continue;
      this.processPost(post);
      this.intersectionObserver?.unobserve(post);
      this.observedPosts.delete(post);
    }
  }

  private processPost(post: HTMLElement): void {
    if (!this.started) return;
    if (post.hasAttribute(PROCESSED_MARKER_ATTR)) return;
    post.setAttribute(PROCESSED_MARKER_ATTR, 'true');
    this.trackedPosts.add(post);

    const generation = this.generation;

    for (const detector of this.registry.getAll()) {
      for (const ref of detector.scan(post)) {
        detector
          .resolve(ref)
          .then(tagData => this.paint(ref, tagData, generation))
          .catch(error => console.error('Web Widgets resolve error:', error));
      }
    }
  }

  // Paint a resolved ref, guarded by the generation token and the post still being tracked
  private paint(ref: DetectedRef, tagData: TagData | null, generation: number): void {
    if (!this.started) return;
    if (generation !== this.generation) return;
    if (!tagData) return;
    if (!this.trackedPosts.has(ref.postEl)) return;

    const mounted = mountPill(ref, tagData);
    if (!mounted) return;

    const existing = this.rootsByPost.get(ref.postEl);
    if (existing) {
      existing.push(mounted);
    } else {
      this.rootsByPost.set(ref.postEl, [mounted]);
    }
  }

  // Unmount a post's roots and remove its host nodes. Called only on removal and stop()
  private teardownPost(post: HTMLElement): void {
    const mounts = this.rootsByPost.get(post);
    if (!mounts) return;
    for (const { root, host } of mounts) {
      root.unmount();
      host.remove();
    }
    this.rootsByPost.delete(post);
  }

  // Fully drop a removed post: unmount roots, stop observing, forget it
  private dropPost(post: HTMLElement): void {
    this.teardownPost(post);
    this.intersectionObserver?.unobserve(post);
    this.observedPosts.delete(post);
    this.trackedPosts.delete(post);
  }

  private readonly onPopState = (): void => {
    if (this.started) this.scheduleDiscover();
  };

  private patchHistory(): void {
    const history = window.history;
    this.originalPushState = history.pushState.bind(history);
    this.originalReplaceState = history.replaceState.bind(history);

    history.pushState = (...args: Parameters<History['pushState']>) => {
      this.originalPushState?.(...args);
      this.scheduleDiscover();
    };
    history.replaceState = (...args: Parameters<History['replaceState']>) => {
      this.originalReplaceState?.(...args);
      this.scheduleDiscover();
    };
  }

  private restoreHistory(): void {
    if (this.originalPushState) {
      window.history.pushState = this.originalPushState;
      this.originalPushState = null;
    }
    if (this.originalReplaceState) {
      window.history.replaceState = this.originalReplaceState;
      this.originalReplaceState = null;
    }
  }
}
