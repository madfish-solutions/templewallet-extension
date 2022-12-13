export const openLink = (href: string, newTab = true, noreferrer = false) => {
  const anchor = document.createElement('a');
  anchor.href = href;
  if (newTab) anchor.target = '_blank';
  if (noreferrer) anchor.rel = 'noreferrer';
  anchor.click();
};
