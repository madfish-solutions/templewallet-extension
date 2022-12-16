import { isDefined } from '@rnw-community/shared';

import { BrowserContext } from '../classes/browser-context.class';

const getSelector = (testID: string) => `[data-testid="${testID}"]`;

export const findElement = async (testID: string) => {
  const selector = getSelector(testID);

  const element = await BrowserContext.page.waitForSelector(selector, { visible: true, timeout: 30000 });

  if (isDefined(element)) {
    return element;
  }

  throw new Error(`"${testID}" not found`);
};

export const createPageElement = (testID: string) => ({
  waitForDisplayed: async () => findElement(testID),
  click: async () => {
    const element = await findElement(testID);
    await element.click();
  },
  type: async (text: string) => {
    const element = await findElement(testID);
    await element.type(text);
  },
  getText: async () => {
    const element = await findElement(testID);

    return element.evaluate(innerElement => innerElement.textContent);
  }
});
