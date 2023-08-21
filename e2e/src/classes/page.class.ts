import { BrowserContext } from 'e2e/src/classes/browser-context.class';

export abstract class Page {
  abstract isVisible(): void;

  async scrollTo(countOfScroll: number) {
    await BrowserContext.page.evaluate(scrollValue => {
      window.scrollTo({ top: scrollValue, behavior: 'smooth' });
    }, countOfScroll);
  }
}
