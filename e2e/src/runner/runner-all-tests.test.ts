import { afterEachHook } from '../hooks/after-each.hook';
import { beforeAllHook } from '../hooks/before-all.hook';
import { beforeEachHook } from '../hooks/before-each.hook';
import { ImportExistingWallet } from "../scenarios/import-existing-wallet.scenario";
import { test } from '../utils/extension.fixtures';

// Hooks

test.beforeAll(async () => {
  await beforeAllHook();
});

test.beforeEach(async () => {
  await beforeEachHook();
});

test.afterEach(async () => {
  await afterEachHook();
});

// Scenarios

  test('import existing wallet: Positive Scenario', async () => {
    await ImportExistingWallet();
  });

