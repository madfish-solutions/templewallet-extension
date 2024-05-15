import { EXTENSION_ID, test, expect, page } from 'e2e/fixtures/extension';

test.describe('Example', () => {
  test('BG Extension ID', async ({ extensionId }) => {
    console.log('Extension ID:', extensionId);

    await new Promise(res => setTimeout(res, 5000));

    expect(extensionId).toEqual(EXTENSION_ID);
    expect(extensionId).toEqual('gndfdfigmjebllgpfdapkcnedmebglam');
  });

  test('FG Extension ID', async ({ extensionId }) => {
    console.log('Extension ID:', extensionId);

    await new Promise(res => setTimeout(res, 5000));

    expect(extensionId).toEqual(EXTENSION_ID);
    expect(extensionId).toEqual('gndfdfigmjebllgpfdapkcnedmebglam');
  });

  test('TW.com Title', async () => {
    await page.goto('https://templewallet.com/');

    await new Promise(res => setTimeout(res, 2000));

    await expect(page).toHaveTitle(
      'Temple Wallet - Cryptocurrency wallet for the Tezos blockchain | Temple - Tezos Wallet'
    );
  });
});
