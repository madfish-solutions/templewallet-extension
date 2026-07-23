import browser from 'webextension-polyfill';

// x.com (and most hosts) serve a CSP that blocks external webfonts. We instead fetch the
// bundled font files as extension resources (not page-CSP governed) and register them via the
// FontFace API, so the faces are available inside the widget's shadow roots.
const WIDGET_FONTS = [
  { family: 'Inter', weight: '400', file: 'Inter-Regular.woff2' },
  { family: 'Inter', weight: '500', file: 'Inter-Medium.woff2' },
  { family: 'Inter', weight: '600', file: 'Inter-SemiBold.woff2' },
  { family: 'Rubik', weight: '400', file: 'Rubik-Regular.woff2' },
  { family: 'Rubik', weight: '500', file: 'Rubik-Medium.woff2' }
];

let started = false;

export function loadWidgetFonts(): void {
  if (started || typeof document === 'undefined' || !document.fonts) return;
  started = true;

  for (const { family, weight, file } of WIDGET_FONTS) {
    fetch(browser.runtime.getURL(`fonts/${file}`))
      .then(response => response.arrayBuffer())
      .then(buffer => {
        const face = new FontFace(family, buffer, { weight, style: 'normal', display: 'swap' });
        return face.load();
      })
      .then(face => {
        document.fonts.add(face);
      })
      .catch(() => {});
  }
}
