export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string
): HTMLElementTagNameMap[K];
export function el(tag: string, className?: string, text?: string): HTMLElement;
export function el(tag: string, className?: string, text?: string): HTMLElement {
  const element = document.createElement(tag);

  if (className) {
    element.className = className;
  }

  if (text) {
    element.textContent = text;
  }

  return element;
}
