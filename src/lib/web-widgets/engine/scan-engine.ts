import { debounce } from 'lodash';

import { mountLinkHover } from '../pill/mount-link-hover';
import { mountPill, type MountedPill } from '../pill/mount-pill';
import type { DetectorRegistry } from '../registry';
import { TWEET } from '../x-dom/selectors';

import type { DetectedRef, TagData } from './types';

const DEBOUNCE_MS = 250;
const VIEWPORT_ROOT_MARGIN = '600px';
const PROCESSED_MARKER_ATTR = 'data-tw-web-widgets';

export class ScanEngine {
  private started = false;
  private generation = 0;

  private mutationObserver: MutationObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;

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

    this.discover();
  }

  stop(): void {
    if (!this.started) return;
    this.started = false;

    // Invalidate every in-flight resolve()
    this.generation++;

    this.scheduleDiscover.cancel();

    this.mutationObserver?.disconnect();
    this.mutationObserver = null;

    this.intersectionObserver?.disconnect();
    this.intersectionObserver = null;
    this.observedPosts.clear();

    for (const post of this.trackedPosts) this.teardownPost(post);
    this.trackedPosts.clear();

    // Clear processed markers so re-enabling Token Insight re-scans every post and
    // re-renders its pills instead of skipping them as already processed.
    for (const post of document.querySelectorAll<HTMLElement>(`[${PROCESSED_MARKER_ATTR}]`)) {
      post.removeAttribute(PROCESSED_MARKER_ATTR);
    }
  }

  private discover(): void {
    for (const post of document.querySelectorAll<HTMLElement>(TWEET)) {
      if (post.hasAttribute(PROCESSED_MARKER_ATTR)) continue;
      if (this.observedPosts.has(post)) continue;
      this.observedPosts.add(post);
      this.intersectionObserver?.observe(post);
    }
  }

  private readonly scheduleDiscover = debounce(() => {
    if (this.started) this.discover();
  }, DEBOUNCE_MS);

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

    const mounts: MountedPill[] = [];
    const pill = mountPill(ref, tagData);
    if (pill) mounts.push(pill);
    if (ref.kind === 'objkt' && ref.linkEl) mounts.push(mountLinkHover(ref.linkEl, tagData));
    if (mounts.length === 0) return;

    const existing = this.rootsByPost.get(ref.postEl);
    if (existing) {
      existing.push(...mounts);
    } else {
      this.rootsByPost.set(ref.postEl, mounts);
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
}
