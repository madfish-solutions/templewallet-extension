import { TWEET_TEXT } from '../../x-dom/selectors';

const isExcludedAnchor = (anchor: HTMLAnchorElement): boolean => {
  if ((anchor.textContent ?? '').startsWith('@')) return true;

  const href = anchor.getAttribute('href') ?? '';
  if (/^\/[A-Za-z0-9_]+$/.test(href)) return true;
  if (/^https?:\/\//i.test(href)) return true;

  return false;
};

export const extractPostText = (post: HTMLElement): string => {
  const root = post.querySelector(TWEET_TEXT);
  if (!root) return '';

  let out = '';

  const walk = (node: Node): void => {
    for (const child of node.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        out += child.textContent ?? '';
      } else if (child instanceof HTMLAnchorElement) {
        if (!isExcludedAnchor(child)) out += child.textContent ?? '';
      } else if (child instanceof HTMLElement) {
        walk(child);
      }
    }
  };

  walk(root);

  return out;
};
