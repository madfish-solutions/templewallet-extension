import { isDefined } from '@rnw-community/shared';
import retry from 'async-retry';
import { ElementHandle } from 'puppeteer';

import { BrowserContext } from '../classes/browser-context.class';
import { MEDIUM_TIMEOUT } from './timing.utils';

const buildTestIDSelector = (testID: string) => `[data-testid="${testID}"]`;

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

  if (isDefined(element)) {
    return element;
  }

  throw new Error(`${selectors} not found`);
};

export const findElements = async (testID: string) => {
  const selector = buildTestIDSelector(testID);

  const elements = await BrowserContext.page.$$(selector);

  if (elements.length !== 0) {
    return elements;
  }

  throw new Error(`None of "${testID}" elements were found`);
};

class PageElement {
  constructor(public selector: string) {}

  findElement(timeout?: number, errorTitle?: string) {
    return findElementBySelectors(this.selector, timeout, errorTitle);
  }

  findDescendant(descendantSelector: string) {
    return findElementBySelectors(`${this.selector} ${descendantSelector}`);
  }

  waitForDisplayed(timeout?: number) {
    return this.findElement(timeout);
  }

  async click() {
    const element = await this.findElement();
    await element.click();
  }

  async type(text: string) {
    const element = await this.findElement();
    await element.type(text);
  }

  async clearInput() {
    await BrowserContext.page.keyboard.press('End');
    await BrowserContext.page.keyboard.down('Shift');
    await BrowserContext.page.keyboard.press('Home');
    await BrowserContext.page.keyboard.up('Shift');
    await BrowserContext.page.keyboard.press('Backspace');
  }
  async getText() {
    const element = await this.findElement();
    return getElementText(element);
  }
  async waitForText(expectedText: string, timeout = MEDIUM_TIMEOUT) {
    const element = await this.findElement(timeout);

    if (timeout > 0) {
      return await retry(
        () =>
          getElementText(element).then(text => {
            if (text === expectedText) return true;

            throw new Error(`Waiting for expected text in \`${this.selector}\` timed out (${timeout} ms)`);
          }),
        { maxRetryTime: timeout }
      );
    }

    const text = await getElementText(element);
    return text === expectedText;
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

    const textContent = innerElement.textContent;

    if (textContent == null) {
      throw new Error("Element's content is not text!");
    }

    return textContent;
  });

const buildSelectorPairs = (selectors: OtherSelectors) => {
  return Object.entries(selectors).map(([key, val]) =>
    val ? (`data-${key}="${val}"` as const) : (`data-${key}` as const)
  );
};

const buildSelector = (testID: string, otherSelectors?: OtherSelectors) => {
  const pairs = buildSelectorPairs({ ...otherSelectors, testid: testID });
  return `[${pairs.join('][')}]`;
};

const buildNotSelector = (notSelectors: OtherSelectors) => {
  const pairs = buildSelectorPairs(notSelectors);
  return `:not([${pairs.join(']):not([')}])`;
};
