import { isDefined } from '@rnw-community/shared';
import retry from 'async-retry';
import { ElementHandle } from 'puppeteer';

import { BrowserContext } from '../classes/browser-context.class';
import { MEDIUM_TIMEOUT } from './timing.utils';

const buildTestIDSelector = (testID: string) => `[data-testid="${testID}"]`;

type OtherSelectors = Record<string, string>;

export const findElement = async (testID: string, otherSelectors?: OtherSelectors, timeout = MEDIUM_TIMEOUT) => {
  const selector = buildSelector(testID, otherSelectors);

  return await findElementBySelectors(selector, timeout);
};

export const findElementBySelectors = async (selectors: string, timeout = MEDIUM_TIMEOUT) => {
  const element = await BrowserContext.page.waitForSelector(selectors, { visible: true, timeout });

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
  constructor(public testID: string, public otherSelectors?: OtherSelectors, public notSelectors?: OtherSelectors) {}

  findElement(timeout?: number) {
    let selectors = buildSelector(this.testID, this.otherSelectors);
    if (this.notSelectors) selectors += buildNotSelector(this.notSelectors);

    return findElementBySelectors(selectors, timeout);
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
    const element = await this.findElement();

    if (timeout > 0) {
      return await retry(
        () =>
          getElementText(element).then(text => {
            if (text === expectedText) return true;

            const selector = buildSelector(this.testID, this.otherSelectors);
            throw new Error(`Waiting for expected text in \`${selector}\` timed out (${timeout} ms)`);
          }),
        { maxRetryTime: timeout }
      );
    }

    const text = await getElementText(element);
    return text === expectedText;
  }
}

export const createPageElement = (testID: string, otherSelectors?: OtherSelectors, notSelectors?: OtherSelectors) =>
  new PageElement(testID, otherSelectors, notSelectors);

export const getElementText = (element: ElementHandle) =>
  element.evaluate(innerElement => {
    if (innerElement instanceof HTMLInputElement) {
      return innerElement.value;
    }

    if (innerElement.textContent) {
      return innerElement.textContent;
    }

    throw new Error('Element text not found');
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
