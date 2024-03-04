import retry from 'async-retry';
import { ElementHandle } from 'puppeteer';

import { BrowserContext } from '../classes/browser-context.class';

import { MEDIUM_TIMEOUT } from './timing.utils';

type OtherSelectors = Record<string, string>;

export const findElement = async (
  testID: string,
  otherSelectors?: OtherSelectors,
  timeout = MEDIUM_TIMEOUT,
  errorTitle?: string
) => {
  const selector = buildSelector(testID, otherSelectors);

  return await findElementBySelectors(selector, timeout, errorTitle);
};

export const findElementBySelectors = async (selectors: string, timeout = MEDIUM_TIMEOUT, errorTitle?: string) => {
  const element = await BrowserContext.page.waitForSelector(selectors, { visible: true, timeout }).catch(error => {
    if (errorTitle && error instanceof Error) {
      error.message = `${errorTitle}\n` + error.message;
    }
    throw error;
  });

  if (!element) throw new Error(`${selectors} not found`);

  return element;
};

export const findElements = async (testID: string) => {
  const selector = buildTestIDSelector(testID);

  const elements = await BrowserContext.page.$$(selector);

  if (!elements.length) throw new Error(`None of "${testID}" elements were found`);

  return elements;
};

class PageElement {
  constructor(public selector: string) {}

  createChildElement(testID: string, otherSelectors?: OtherSelectors) {
    const childSelector = buildSelector(testID, otherSelectors);
    const selectors = buildChildSelector(this.selector, childSelector);

    return new PageElement(selectors);
  }

  findElement(timeout?: number, errorTitle?: string) {
    return findElementBySelectors(this.selector, timeout, errorTitle);
  }

  waitForDisplayed(timeout?: number, errorTitle?: string) {
    return this.findElement(timeout, errorTitle);
  }

  async click(timeout?: number, errorTitle?: string) {
    const element = await this.findElement(timeout, errorTitle);
    await element.click();
  }

  async type(text: string) {
    const element = await this.findElement();
    await element.type(text);
  }

  async getText() {
    const element = await this.findElement();
    return getElementText(element);
  }

  async waitForText(expectedText: string, timeout = MEDIUM_TIMEOUT) {
    if (timeout <= 0) {
      const element = await this.findElement(timeout);
      const text = await getElementText(element);
      return text === expectedText;
    }

    return await retry(
      async () => {
        const element = await this.findElement(timeout);
        const text = await getElementText(element);

        if (text === expectedText) return true;

        throw new Error(`Waiting for expected text in \`${this.selector}\` timed out (${timeout} ms)`);
      },
      { maxRetryTime: timeout }
    );
  }
}

export const createPageElement = (testID: string, otherSelectors?: OtherSelectors, notSelectors?: OtherSelectors) => {
  let selector = buildSelector(testID, otherSelectors);
  if (notSelectors) selector += buildNotSelector(notSelectors);

  return new PageElement(selector);
};

export const getElementText = (element: ElementHandle) =>
  element.evaluate(innerElement => {
    if (innerElement instanceof HTMLInputElement) {
      return innerElement.value;
    }

    const textContent = innerElement.textContent?.replace(/\n/g, ' ');

    if (textContent == null) {
      throw new Error("Element's content is not text!");
    }

    return textContent;
  });

const buildTestIDSelector = (testID: string) => `[data-testid="${testID}"]`;

const buildSelectorPairs = (selectors: OtherSelectors) => {
  return Object.entries(selectors).map(([key, val]) =>
    val ? (`data-${key}="${val}"` as const) : (`data-${key}` as const)
  );
};

export const buildSelector = (testID: string, otherSelectors?: OtherSelectors) => {
  const pairs = buildSelectorPairs({ ...otherSelectors, testid: testID });
  return `[${pairs.join('][')}]`;
};

const buildNotSelector = (notSelectors: OtherSelectors) => {
  const pairs = buildSelectorPairs(notSelectors);
  return `:not([${pairs.join(']):not([')}])`;
};

const buildChildSelector = (parentSelector: string, childSelector: string) => `${parentSelector} ${childSelector}`;
