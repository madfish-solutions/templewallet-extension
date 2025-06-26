import './main.css';

import React, { FC, useCallback } from 'react';

import classNames from 'clsx';
import { createRoot } from 'react-dom/client';
import browser from 'webextension-polyfill';

import 'lib/ledger/proxy/foreground';
import 'lib/keep-bg-worker-alive/script';

import DisableOutlinesForClick from 'app/a11y/DisableOutlinesForClick';
import Dialogs from 'app/layouts/Dialogs';
import { StoreProvider } from 'app/store/provider';
import { getMessage, T } from 'lib/i18n';
import { clearAllStorages } from 'lib/temple/reset';
import { AlertFn, ConfirmFn, DialogsProvider, useAlert, useConfirm } from 'lib/ui/dialog';

const OptionsWrapper: FC = () => (
  <StoreProvider>
    <DialogsProvider>
      <Options />
      <Dialogs />
      <DisableOutlinesForClick />
    </DialogsProvider>
  </StoreProvider>
);

const Options: FC = () => {
  const customAlert = useAlert();
  const confirm = useConfirm();

  const internalHandleReset = useCallback(() => {
    handleReset(customAlert, confirm);
  }, [customAlert, confirm]);

  return (
    <div className="p-4">
      <h1 className="mb-2 text-xl font-semibold">
        <T id="templeWalletOptions" />
      </h1>

      <div className="my-6">
        <button
          className={classNames(
            'relative',
            'px-2 py-1',
            'bg-primary-orange rounded',
            'border-2 border-primary-orange',
            'flex items-center',
            'text-primary-orange-lighter',
            'text-sm font-semibold',
            'transition duration-200 ease-in-out',
            'opacity-90 hover:opacity-100 focus:opacity-100',
            'shadow-sm hover:shadow focus:shadow'
          )}
          onClick={internalHandleReset}
        >
          <T id="resetExtension" />
        </button>
      </div>
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<OptionsWrapper />);

let resetting = false;
async function handleReset(customAlert: AlertFn, confirm: ConfirmFn) {
  if (resetting) return;
  resetting = true;

  const confirmed = await confirm({
    title: getMessage('actionConfirmation'),
    children: <T id="resetExtensionConfirmation" />
  });
  if (confirmed) {
    (async () => {
      try {
        await clearAllStorages();
        browser.runtime.reload();
      } catch (err: any) {
        await customAlert({
          title: getMessage('error'),
          children: err.message
        });
      }
    })();
  }

  resetting = false;
}
