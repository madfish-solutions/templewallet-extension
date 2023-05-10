import { isDefined } from '@rnw-community/shared';
import { ElementHandle } from 'puppeteer';

import { BrowserContext } from '../classes/browser-context.class';
import { MEDIUM_TIMEOUT } from './timing.utils';

const buildTestIDSelector = (testID: string) => `[data-testid="${testID}"]`;

type OtherSelectors = Record<string, string>;

const buildSelector = (testID: string, otherSelectors?: OtherSelectors) => {
  const pairs = Object.entries({ ...otherSelectors, testid: testID }).map(
    ([key, val]) => `data-${key}="${val}"` as const
  );
  return `[${pairs.join('][')}]`;
};

export const findElement = async (testID: string, otherSelectors?: OtherSelectors, timeout = MEDIUM_TIMEOUT) => {
  const selector = buildSelector(testID, otherSelectors);

  const element = await BrowserContext.page.waitForSelector(selector, { visible: true, timeout });

  if (isDefined(element)) {
    return element;
  }

  throw new Error(`"${testID}" not found`);
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
  constructor(public testID: string, public otherSelectors?: OtherSelectors) {}

  findElement(timeout?: number) {
    return findElement(this.testID, this.otherSelectors, timeout);
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
    await BrowserContext.page.keyboard.down('Shift');
    await BrowserContext.page.keyboard.press('Home');
    await BrowserContext.page.keyboard.press('Backspace');
  }
  async getText() {
    const element = await this.findElement();
    return getElementText(element);
  }
}

export const createPageElement = (testID: string, otherSelectors?: OtherSelectors) =>
  new PageElement(testID, otherSelectors);

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
