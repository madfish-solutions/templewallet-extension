import { CustomBrowserContext } from '../classes/browser-context.class';

export const switchToPage = async (pageUrl: string) => {
  const pages = CustomBrowserContext.browser.pages();

  for (const page of pages) {
    if (page.url().startsWith(pageUrl)) {
      await page.bringToFront();

      return (CustomBrowserContext.page = page);
    }
  }
};
