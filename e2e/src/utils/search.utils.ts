import { CustomBrowserContext } from '../classes/browser-context.class';
import { Locator } from "@playwright/test";


const buildTestIDSelector = (testID: string) => `[data-testid="${testID}"]`;

export const findElement = async (testID: string) => {
  const selector = buildTestIDSelector(testID);

  return await findElementBySelector(selector);
};

export const findElementBySelector = async (selectors: string) => {
  const element = await CustomBrowserContext.page.getByTestId(selectors)

  if (!element) throw new Error(`${selectors} not found`);

  return element;
};

export const findElements = async (testID: string) => {
  const selector = buildTestIDSelector(testID);

  const elements = await CustomBrowserContext.page.$$(selector);

  if (!elements.length) throw new Error(`None of "${testID}" elements were found`);

  return elements;
};


export const createPageElement = (selector: string) => {
  buildTestIDSelector(selector)
  return new PageElement(selector);
};

export class PageElement {
  constructor(public selector: string) {}


  async findElement(errorTitle?: string) {
    return findElementBySelector(this.selector).catch(error => {
      if (errorTitle && error instanceof Error ) {
        error.message = `${errorTitle}\n` + error.message;
      }
      throw error;
    });
    ;
  }

  async waitForDisplayed() {
    return this.findElement();
  }

  async click() {
    const element = await this.findElement();
    return await (element as Locator).click();;
  }

  async fill(text: string) {
    const element = await this.findElement();
    return await (element as Locator).fill(text);
  }

  async getText() {
    const element = await this.findElement();
    return await (element as Locator).textContent()
  }

  async getValue() {
    const element = await this.findElement();
    return await (element as Locator).innerText()
  }

}

