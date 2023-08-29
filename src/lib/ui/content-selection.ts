export const selectNodeContent = (node: Node | nullish) => {
  if (!node) return;

  const selection = window.getSelection();
  selection?.removeAllRanges();

  const range = document.createRange();
  range.selectNodeContents(node);
  selection?.addRange(range);
};
