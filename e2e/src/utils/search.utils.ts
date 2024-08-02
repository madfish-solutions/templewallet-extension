import { Locator } from '@playwright/test';
import { ElementHandle } from 'playwright';

import { CustomBrowserContext } from '../classes/browser-context.class';

import { SHORT_TIMEOUT } from './timing.utils';

const buildTestIDSelector = (testID: string) => `[data-testid="${testID}"]`;

export const findElement = async (testID: string) => {
  const selector = buildTestIDSelector(testID);

  return await findElementBySelector(selector);
};

export const findElementBySelector = async (selectors: string) => {
  const element = CustomBrowserContext.page.getByTestId(selectors);

  if (!element) throw new Error(`${selectors} not found`);

  return element;
};

export const findElements = async (testID: string, count?: number) => {
  const selector = buildTestIDSelector(testID);

  const elements = await CustomBrowserContext.page.$$(selector);

  if (!elements.length) throw new Error(`None of "${testID}" elements were found`);
  if (count && elements.length !== count)
    throw new Error(`Expected ${count} '${testID}' elements, but got ${elements.length}`);

  return elements;
};

export const createPageElement = (selector: string) => {
  buildTestIDSelector(selector);
  return new PageElement(selector);
};

export class PageElement {
  constructor(public selector: string) {}

  async findElement(errorTitle?: string): Promise<Locator> {
    return findElementBySelector(this.selector).catch(error => {
      if (errorTitle && error instanceof Error) {
        error.message = `${errorTitle}\n` + error.message;
      }
      throw error;
    });
  }

  async findElements(count?: number, errorTitle?: string): Promise<ElementHandle<SVGElement | HTMLElement>[]> {
    return findElements(this.selector, count).catch(error => {
      if (errorTitle && error instanceof Error) {
        error.message = `${errorTitle}\n` + error.message;
      }
      throw error;
    });
  }

  async waitForDisplayed(timeout = SHORT_TIMEOUT, state?: 'attached' | 'detached' | 'visible' | 'hidden') {
    const element = await this.findElement();
    return element.waitFor({ timeout, state });
  }

  async click(clickCount?: number, delay?: number) {
    const element = await this.findElement();
    return await element.click({ clickCount: clickCount, delay: delay });
  }

  async focus(timeout?: number) {
    const element = await this.findElement();
    return await element.focus({ timeout: timeout });
  }

  async fill(text: string, force?: boolean, noWaitAfter?: boolean, timeout?: number) {
    const element = await this.findElement();
    return await element.fill(text, { force, noWaitAfter, timeout });
  }

  async getText(timeout?: number) {
    const element = await this.findElement();
    return await element.textContent({ timeout });
  }

  async getValue(timeout?: number) {
    const element = await this.findElement();
    return await element.innerText({ timeout });
  }
}
