import { test, expect, page } from 'e2e/fixtures/extension';

test.describe('Example 2', () => {
  test('BG Extension ID', async ({ extensionId }) => {
    console.log('Extension ID:', extensionId);

   await page.goto('https://jabko.ua/ipad/ipad-air-10-5/apple-ipad-air--2022-/apple-ipad-air--64gb--wi-fi--blue--2022-')
    await new Promise(res => setTimeout(res, 2000));
  });

  test('FG Extension ID', async ({ extensionId }) => {
    console.log('Extension ID:', extensionId);

   await page.goto('https://github.com/madfish-solutions/templewallet-extension/pull/1143/files')
    await new Promise(res => setTimeout(res, 2000));
  });

  test('TW.com Title', async () => {
    await page.goto('https://templewallet.com/');

    await new Promise(res => setTimeout(res, 2000));

    await expect(page).toHaveTitle(
      'Temple Wallet - Cryptocurrency wallet for the Tezos blockchain | Temple - Tezos Wallet'
    );
  });
});

test.afterAll(() => {
  // context.close();
  console.log('after all hook in the file')
});

test.afterEach(() => {
  console.log('after each hook in the file!')
})
