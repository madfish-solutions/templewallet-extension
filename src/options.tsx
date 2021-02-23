import "./main.css";

import * as React from "react";
import * as ReactDOM from "react-dom";
import classNames from "clsx";
import { browser } from "webextension-polyfill-ts";
import { getMessage } from "lib/i18n";
import { T } from "lib/i18n/react";
import {
  AlertFn,
  ConfirmFn,
  DialogsProvider,
  useAlert,
  useConfirm,
} from "lib/ui/dialog";
import DisableOutlinesForClick from "app/a11y/DisableOutlinesForClick";
import Dialogs from "app/layouts/Dialogs";

const OptionsWrapper: React.FC = () => (
  <DialogsProvider>
    <Options />
    <Dialogs />
    <DisableOutlinesForClick />
  </DialogsProvider>
);

const Options: React.FC = () => {
  const alert = useAlert();
  const confirm = useConfirm();

  const internalHandleReset = React.useCallback(() => {
    handleReset(alert, confirm);
  }, [alert, confirm]);

  return (
    <div className="p-4">
      <h1 className="mb-2 text-xl font-semibold">
        {getMessage("templeWalletOptions")}
      </h1>

      <div className="my-6">
        <button
          className={classNames(
            "relative",
            "px-2 py-1",
            "bg-primary-orange rounded",
            "border-2 border-primary-orange",
            "flex items-center",
            "text-primary-orange-lighter",
            "text-sm font-semibold",
            "transition duration-200 ease-in-out",
            "opacity-90 hover:opacity-100 focus:opacity-100",
            "shadow-sm hover:shadow focus:shadow"
          )}
          onClick={internalHandleReset}
        >
          {getMessage("resetExtension")}
        </button>
      </div>
    </div>
  );
};

ReactDOM.render(<OptionsWrapper />, document.getElementById("root"));

let resetting = false;
async function handleReset(alert: AlertFn, confirm: ConfirmFn) {
  if (resetting) return;
  resetting = true;

  const confirmed = await confirm({
    title: getMessage("actionConfirmation"),
    children: <T id="resetExtensionConfirmation" />,
  });
  if (confirmed) {
    (async () => {
      try {
        await browser.storage.local.clear();
        browser.runtime.reload();
      } catch (err) {
        await alert({
          title: getMessage("error"),
          children: err.message,
        });
      }
    })();
  }

  resetting = false;
}
