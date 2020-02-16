import * as React from "react";
import createUseContext from "constate";
import useSWR from "swr";
import { browser } from "webextension-polyfill-ts";
import {
  ThanosMessageType,
  ThanosRequest,
  ThanosResponse,
  ThanosStatus
} from "lib/thanos/types";

const NO_RES_ERROR_MESSAGE = "Invalid response recieved";

export const useThanosFrontContext = createUseContext(useThanosFront);

function useThanosFront() {
  const fetchState = React.useCallback(async () => {
    const res = await sendMessage({ type: ThanosMessageType.GetStateRequest });
    if (res.type === ThanosMessageType.GetStateResponse) {
      return res.state;
    } else {
      throw new Error(NO_RES_ERROR_MESSAGE);
    }
  }, []);

  const stateSWR = useSWR("stub", fetchState, {
    suspense: true,
    shouldRetryOnError: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });
  const state = stateSWR.data!;
  const idle = state.status === ThanosStatus.Idle;
  const locked = state.status === ThanosStatus.Locked;
  const ready = state.status === ThanosStatus.Ready;

  React.useEffect(() => {
    browser.runtime.onMessage.addListener(handleMessage);

    return () => {
      browser.runtime.onMessage.removeListener(handleMessage);
    };

    function handleMessage(msg: any) {
      switch (msg?.type) {
        case ThanosMessageType.StateUpdated:
          stateSWR.revalidate();
          break;
      }
    }
  }, [stateSWR]);

  const { status, account } = state;

  const unlock = React.useCallback(async (password: string) => {
    const res = await sendMessage({
      type: ThanosMessageType.UnlockRequest,
      password
    });
    if (res.type !== ThanosMessageType.UnlockResponse) {
      throw new Error(NO_RES_ERROR_MESSAGE);
    }
  }, []);

  const registerWallet = React.useCallback(
    async (mnemonic: string, password: string) => {
      const res = await sendMessage({
        type: ThanosMessageType.NewWalletRequest,
        mnemonic,
        password
      });
      if (res.type !== ThanosMessageType.NewWalletResponse) {
        throw new Error(NO_RES_ERROR_MESSAGE);
      }
    },
    []
  );

  return { status, account, idle, locked, ready, unlock, registerWallet };
}

async function sendMessage(msg: ThanosRequest) {
  const res = await browser.runtime.sendMessage(msg);
  if ("type" in res) {
    return res as ThanosResponse;
  } else {
    throw new Error(NO_RES_ERROR_MESSAGE);
  }
}
