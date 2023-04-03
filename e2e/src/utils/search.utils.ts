import { isDefined } from '@rnw-community/shared';
import { ElementHandle } from 'puppeteer';

import { BrowserContext } from '../classes/browser-context.class';
import { MEDIUM_TIMEOUT } from './timing.utils';

const getSelector = (testID: string) => `[data-testid="${testID}"]`;

const findElement = async (testID: string) => {
  const selector = getSelector(testID);

  const element = await BrowserContext.page.waitForSelector(selector, { visible: true, timeout: MEDIUM_TIMEOUT });

  if (isDefined(element)) {
    return element;
  }

  throw new Error(`"${testID}" not found`);
};

export const findElements = async (testID: string) => {
  const selector = getSelector(testID);

  const elements = await BrowserContext.page.$$(selector);

  if (elements.length !== 0) {
    return elements;
  }

  throw new Error(`None of "${testID}" elements where found found`);
};

class PageElement {
  constructor(public testID: string) {}

  findElement() {
    return findElement(this.testID);
  }
  waitForDisplayed() {
    return this.findElement();
  }
  async click() {
    const element = await this.findElement();
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
}

export const createPageElement = (testID: string) => new PageElement(testID);

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
