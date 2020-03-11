import * as React from "react";
import constate from "constate";
import useSWR from "swr";
import { browser } from "webextension-polyfill-ts";
import { TezosToolkit } from "@taquito/taquito";
import usePassiveStorage from "lib/thanos/front/usePassiveStorage";
import {
  ThanosMessageType,
  ThanosStatus,
  ThanosRequest,
  ThanosResponse
} from "lib/thanos/types";

const NO_RES_ERROR_MESSAGE = "Invalid response recieved";

export const [ThanosFrontProvider, useThanosFront] = constate(() => {
  const fetchState = React.useCallback(async () => {
    const res = await sendMessage({ type: ThanosMessageType.GetStateRequest });
    assertResponse(res.type === ThanosMessageType.GetStateResponse);
    return res.state;
  }, []);

  const stateSWR = useSWR("stub", fetchState, {
    suspense: true,
    shouldRetryOnError: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });
  const state = stateSWR.data!;

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

  const { status, accounts } = state;
  const idle = status === ThanosStatus.Idle;
  const locked = status === ThanosStatus.Locked;
  const ready = status === ThanosStatus.Ready;

  const [accIndex, setAccIndex] = usePassiveStorage("account_index", 0);

  const account = accounts[accIndex];
  const accountPkh = account?.publicKeyHash;

  const tezos = React.useMemo(() => {
    if (!accountPkh) {
      return null;
    }

    const t = new TezosToolkit();
    const rpc = "https://babylonnet.tezos.org.ua";
    const signer = new ThanosSigner(accIndex, accountPkh);
    t.setProvider({ rpc, signer });
    return t;
  }, [accIndex, accountPkh]);

  React.useEffect(() => {
    if (accIndex >= accounts.length) {
      setAccIndex(0);
    }
  }, [accounts, accIndex, setAccIndex]);

  const registerWallet = React.useCallback(
    async (password: string, mnemonic?: string) => {
      const res = await sendMessage({
        type: ThanosMessageType.NewWalletRequest,
        password,
        mnemonic
      });
      assertResponse(res.type === ThanosMessageType.NewWalletResponse);
    },
    []
  );

  const unlock = React.useCallback(async (password: string) => {
    const res = await sendMessage({
      type: ThanosMessageType.UnlockRequest,
      password
    });
    assertResponse(res.type === ThanosMessageType.UnlockResponse);
  }, []);

  const lock = React.useCallback(async () => {
    const res = await sendMessage({
      type: ThanosMessageType.LockRequest
    });
    assertResponse(res.type === ThanosMessageType.LockResponse);
  }, []);

  const createAccount = React.useCallback(async () => {
    const res = await sendMessage({
      type: ThanosMessageType.CreateAccountRequest
    });
    assertResponse(res.type === ThanosMessageType.CreateAccountResponse);
  }, []);

  const revealPrivateKey = React.useCallback(
    async (password: string) => {
      const res = await sendMessage({
        type: ThanosMessageType.RevealPrivateKeyRequest,
        accountIndex: accIndex,
        password
      });
      assertResponse(res.type === ThanosMessageType.RevealPrivateKeyResponse);
      return res.privateKey;
    },
    [accIndex]
  );

  const revealMnemonic = React.useCallback(async (password: string) => {
    const res = await sendMessage({
      type: ThanosMessageType.RevealMnemonicRequest,
      password
    });
    assertResponse(res.type === ThanosMessageType.RevealMnemonicResponse);
    return res.mnemonic;
  }, []);

  const editAccountName = React.useCallback(
    async (name: string) => {
      const res = await sendMessage({
        type: ThanosMessageType.EditAccountRequest,
        accountIndex: accIndex,
        name
      });
      assertResponse(res.type === ThanosMessageType.EditAccountResponse);
    },
    [accIndex]
  );

  const importAccount = React.useCallback(async (privateKey: string) => {
    const res = await sendMessage({
      type: ThanosMessageType.ImportAccountRequest,
      privateKey
    });
    assertResponse(res.type === ThanosMessageType.ImportAccountResponse);
  }, []);

  const importFundraiserAccount = React.useCallback(
    async (email: string, password: string, mnemonic: string) => {
      const res = await sendMessage({
        type: ThanosMessageType.ImportFundraiserAccountRequest,
        email,
        password,
        mnemonic
      });
      assertResponse(
        res.type === ThanosMessageType.ImportFundraiserAccountResponse
      );
    },
    []
  );

  return {
    status,
    idle,
    locked,
    ready,
    accounts,
    accIndex,
    account,
    tezos,

    // Callbacks
    setAccIndex,
    registerWallet,
    unlock,
    lock,
    createAccount,
    revealPrivateKey,
    revealMnemonic,
    editAccountName,
    importAccount,
    importFundraiserAccount
  };
});

class ThanosSigner {
  private accIndex: number;
  private pkh: string;

  constructor(accIndex: number, pkh: string) {
    this.accIndex = accIndex;
    this.pkh = pkh;
  }

  async publicKeyHash() {
    return this.pkh;
  }

  async publicKey(): Promise<string> {
    throw new Error("Public key cannot be exposed");
  }

  async secretKey(): Promise<string> {
    throw new Error("Secret key cannot be exposed");
  }

  async sign(bytes: string, watermark?: Uint8Array) {
    const res = await sendMessage({
      type: ThanosMessageType.SignRequest,
      accountIndex: this.accIndex,
      bytes,
      watermark
    });
    assertResponse(res.type === ThanosMessageType.SignResponse);
    return res.result;
  }
}

async function sendMessage(msg: ThanosRequest) {
  const res = await browser.runtime.sendMessage(msg);
  assertResponse("type" in res);
  return res as ThanosResponse;
}

function assertResponse(condition: any): asserts condition {
  if (!condition) {
    throw new Error(NO_RES_ERROR_MESSAGE);
  }
}
