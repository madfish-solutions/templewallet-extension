// Creates a test wallet in a fresh browser profile: imports a throwaway seed, then a public address as watch-only
// so the asset lists are heavy, and re-enables the chains a new wallet disables automatically. The profile is
// "whale" (an EVM address with thousands of tokens) or, with `tezos` as the argument, "whale-tezos" (a Tezos address
// with thousands of NFTs); an existing profile is never overwritten.
//   node perf/setup.mjs [tezos]
// Env: TW_SEED, TW_PASSWORD, TW_WATCH_ADDRESS, TW_PROFILE_NAME (override the defaults, which are public test values).
import fs from 'fs';
import path from 'path';

import { launch, findPageWith, TID, PASSWORD, dismissModals, accountName, OUT_DIR, PROFILES } from './lib.mjs';

const KIND = process.argv[2] ?? 'evm';
if (!['evm', 'tezos'].includes(KIND)) {
  console.error('usage: node perf/setup.mjs [tezos]');
  process.exit(2);
}
const SEED =
  process.env.TW_SEED ??
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
// vitalik.eth, and the Tezos address with the most token balances among a set of known heavy collectors (2,758 on
// TzKT on 2026-09-24, nearly all NFTs).
const WATCH_ADDRESS =
  process.env.TW_WATCH_ADDRESS ??
  (KIND === 'tezos' ? 'tz1WmP4itkDbys47ANRCxcrfu1noJHKuJVTj' : '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
const PROFILE =
  process.env.TW_PROFILE ??
  path.join(PROFILES, process.env.TW_PROFILE_NAME ?? (KIND === 'tezos' ? 'whale-tezos' : 'whale'));
const log = (...a) => console.log('[setup]', ...a);

let pageForScreenshot = null;

const main = async () => {
  if (fs.existsSync(PROFILE)) {
    console.error(`[setup] ${PROFILE} already exists: delete that folder to recreate it, or set TW_PROFILE_NAME.`);
    process.exit(2);
  }
  const { ctx, extId } = await launch({ profile: PROFILE });
  const page = await findPageWith(ctx, extId, TID('Welcome/Import Existing Wallet button'));
  pageForScreenshot = page;
  await page.bringToFront();
  await page.click(TID('Welcome/Import Existing Wallet button'));
  await page.waitForSelector(TID('Import Seed Form/Word Input'), { timeout: 30000 });

  const words = SEED.split(' ');
  const inputs = await page.$$(TID('Import Seed Form/Word Input'));
  for (let i = 0; i < words.length; i++) await inputs[i].fill(words[i]);
  await page.click(TID('Import Seed Form/Next Button'));
  await page.waitForSelector(TID('Register Form/Password Field'), { timeout: 30000 });
  await page.fill(TID('Register Form/Password Field'), PASSWORD);
  await page.fill(TID('Register Form/Repeat Password Field'), PASSWORD);
  for (const sel of ['Register Form/Analytics Check Box', 'Register Form/Get Rewards Check Box'])
    await page.click(TID(sel)).catch(() => {});
  await page.click(TID('Register Form/Import Button'));
  await page.waitForSelector(TID('Home/Account Icon'), { timeout: 60000 });
  await page.waitForTimeout(3000);
  await dismissModals(page);
  log('wallet imported');

  await page.click(TID('Home/Account Icon'));
  await page.waitForSelector(TID('Accounts Modal/New Wallet Actions Button'), { timeout: 15000 });
  await page.click(TID('Accounts Modal/New Wallet Actions Button'));
  await page.waitForTimeout(800);
  await page.click(TID('New Wallet Actions Popper/Watch Only Account'));
  await page.waitForSelector(TID('Import Account(Watch-Only)/Watch Only Input'), { timeout: 15000 });
  await page.fill(TID('Import Account(Watch-Only)/Watch Only Input'), WATCH_ADDRESS);
  await page.waitForTimeout(2000);
  const watchButton = page.locator(TID('Import Account(Watch-Only)/Watch Only Import Button'));
  // Builds from before that test id: the button is found by its label.
  if (await watchButton.count()) await watchButton.click({ timeout: 15000 });
  else await page.getByRole('button', { name: /watch address/i }).click({ timeout: 15000 });
  await page.waitForTimeout(10000);
  await dismissModals(page);

  // New wallets auto-disable every chain the first account holds nothing on, and a watch-only account never re-enables
  // them (only actable accounts do), so the heavy profile would silently measure fewer chains than its owner sees.
  const autoDisablePending = () =>
    page.evaluate(
      async () =>
        (await chrome.storage.local.get('SHOULD_DISABLE_NOT_ACTIVE_NETWORKS')).SHOULD_DISABLE_NOT_ACTIVE_NETWORKS
    );
  for (let i = 0; i < 60 && (await autoDisablePending()); i++) await page.waitForTimeout(1000);
  const reenabled = await page.evaluate(async () => {
    const { EVM_CHAINS_SPECS: specs = {} } = await chrome.storage.local.get('EVM_CHAINS_SPECS');
    const ids = Object.keys(specs).filter(id => specs[id]?.disabled && specs[id]?.disabledAutomatically);
    for (const id of ids) specs[id] = { ...specs[id], disabled: false, disabledAutomatically: false };
    await chrome.storage.local.set({ EVM_CHAINS_SPECS: specs, SHOULD_DISABLE_NOT_ACTIVE_NETWORKS: false });
    return ids;
  });
  await page.waitForTimeout(3000);
  const stillDisabled = await page.evaluate(async () => {
    const { EVM_CHAINS_SPECS: specs = {} } = await chrome.storage.local.get('EVM_CHAINS_SPECS');
    return Object.keys(specs).filter(id => specs[id]?.disabled);
  });
  log(
    're-enabled EVM chains:',
    reenabled.join(', ') || 'none',
    '| disabled after 3 s:',
    stillDisabled.join(', ') || 'none'
  );

  log('done: active account =', await accountName(page));
  await ctx.close();
};
main().catch(async e => {
  console.error('[setup] FAILED', e);
  if (pageForScreenshot && !pageForScreenshot.isClosed()) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    await pageForScreenshot.screenshot({ path: path.join(OUT_DIR, 'setup-failure.png') }).catch(() => {});
    console.error('[setup] screenshot saved to perf/out/setup-failure.png');
  }
  process.exit(1);
});
