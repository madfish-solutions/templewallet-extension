import { CustomBrowserContext } from './browser-context.class';

export abstract class Page {
  abstract isVisible(...args: any[]): void;

  scrollTo(topPositionPx: number) {
    return CustomBrowserContext.page.evaluate(top => {
      if (top <= 0 && window.pageYOffset === 0) return Promise.resolve(false);

      window.scrollTo({ top, behavior: 'smooth' });

      return Promise.race([
        new Promise<true>(resolve => {
          const listener = () => {
            if (top === window.pageYOffset) {
              resolve(true);
              window.removeEventListener('scroll', listener);
            }
          };

          window.addEventListener('scroll', listener);
        }),
        new Promise<false>(resolve => setTimeout(() => resolve(false), 1_000))
      ]);
    }, topPositionPx);
  }
}
