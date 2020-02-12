import * as React from "react";
import createUseContext from "constate";
import useSWR from "swr";
import { browser } from "webextension-polyfill-ts";
import { ThanosFrontState, ThanosMessageType } from "lib/thanos/types";

export const useThanosFrontContext = createUseContext(useThanosFront);

function useThanosFront() {
  const stateSWR = useSWR("stub", fetchState, {
    suspense: true,
    shouldRetryOnError: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  React.useEffect(() => {
    browser.runtime.onMessage.addListener(handleMessage);

    return () => {
      browser.runtime.onMessage.removeListener(handleMessage);
    };

    function handleMessage(msg: any) {
      switch (msg?.type) {
        case ThanosMessageType.STATE_UPDATED:
          stateSWR.revalidate();
          break;
      }
    }
  }, [stateSWR]);

  const state = stateSWR.data!;
  const account = state.account;
  const authorized = React.useMemo(() => Boolean(account), [account]);
  const unlocked = state.unlocked;

  const unlock = React.useCallback(
    (passphrase: string) =>
      browser.runtime.sendMessage({
        type: ThanosMessageType.UNLOCK,
        passphrase
      }),
    []
  );

  const importAccount = React.useCallback(
    (privateKey: string) =>
      browser.runtime.sendMessage({
        type: ThanosMessageType.IMPORT_ACCOUNT,
        privateKey
      }),
    []
  );

  return { account, authorized, unlocked, unlock, importAccount };
}

async function fetchState() {
  const state = await browser.runtime.sendMessage({
    type: ThanosMessageType.GET_STATE
  });
  return state as ThanosFrontState;
}
