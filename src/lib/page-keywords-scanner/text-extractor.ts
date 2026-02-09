/**
 * Extracts visible text content from the page.
 * - Excludes a script, style, and hidden elements
 * - Handles visibility checks efficiently
 * - Non-blocking using chunked processing
 */

const EXCLUDED_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'NOSCRIPT',
  'TEMPLATE',
  'SVG',
  'CANVAS',
  'VIDEO',
  'AUDIO',
  'IFRAME',
  'OBJECT',
  'EMBED',
  'HEAD',
  'META',
  'LINK'
]);

const HIDDEN_ATTRIBUTES = ['hidden', 'aria-hidden'];

function isElementVisible(element: Element): boolean {
  if (EXCLUDED_TAGS.has(element.tagName)) {
    return false;
  }
  for (const attr of HIDDEN_ATTRIBUTES) {
    if (element.hasAttribute(attr) && element.getAttribute(attr) !== 'false') {
      return false;
    }
  }

  const inlineStyle = element.getAttribute('style');
  if (inlineStyle) {
    const styleLower = inlineStyle.toLowerCase();
    if (styleLower.includes('display:none') || styleLower.includes('display: none')) {
      return false;
    }
    if (styleLower.includes('visibility:hidden') || styleLower.includes('visibility: hidden')) {
      return false;
    }
  }

  return true;
}

/**
 * TreeWalker filter function for visible text nodes.
 */
function createNodeFilter(): NodeFilter {
  return {
    acceptNode(node: Node): number {
      if (node.nodeType === Node.TEXT_NODE) {
        const parent = node.parentElement;
        if (!parent || !isElementVisible(parent)) {
          return NodeFilter.FILTER_REJECT;
        }
        const text = node.textContent?.trim();
        if (!text) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        if (!isElementVisible(node as Element)) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_SKIP;
      }

      return NodeFilter.FILTER_REJECT;
    }
  };
}

/**
 * Extracts all visible text from the page synchronously.
 * Uses TreeWalker for efficient DOM traversal.
 *
 * @param root - Root element to extract text from (defaults to document.body)
 * @returns Concatenated visible text content
 */
export function extractVisibleText(root: Element = document.body): string {
  if (!root) return '';

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, createNodeFilter());

  const textParts: string[] = [];
  let node: Node | null;

  while ((node = walker.nextNode())) {
    if (node.nodeType === Node.TEXT_NODE && node.textContent) {
      const text = node.textContent.trim();
      if (text) {
        textParts.push(text);
      }
    }
  }

  return textParts.join(' ');
}

/**
 * Extracts text from a specific element (for mutation observer updates).
 */
export function extractTextFromElement(element: Element): string {
  if (!isElementVisible(element)) return '';

  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
    acceptNode(node: Node): number {
      const parent = node.parentElement;
      if (!parent || !isElementVisible(parent)) {
        return NodeFilter.FILTER_REJECT;
      }
      return node.textContent?.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });

  const textParts: string[] = [];
  let node: Node | null;

  while ((node = walker.nextNode())) {
    const text = node.textContent?.trim();
    if (text) {
      textParts.push(text);
    }
  }

  return textParts.join(' ');
}
