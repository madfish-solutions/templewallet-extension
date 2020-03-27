import * as React from "react";
import constate from "constate";
import useSWR from "swr";
import { buf2hex } from "@taquito/utils";
import toBuffer from "typedarray-to-buffer";
import { IntercomClient } from "lib/intercom";
import {
  ThanosMessageType,
  ThanosStatus,
  ThanosRequest,
  ThanosResponse
} from "lib/thanos/types";

const intercom = new IntercomClient();

export const [ThanosClientProvider, useThanosClient] = constate(() => {
  /**
   * State
   */

  const fetchState = React.useCallback(async () => {
    const res = await request({ type: ThanosMessageType.GetStateRequest });
    assertResponse(res.type === ThanosMessageType.GetStateResponse);
    return res.state;
  }, []);

  const stateSWR = useSWR("state", fetchState, {
    suspense: true,
    shouldRetryOnError: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });
  const state = stateSWR.data!;

  React.useEffect(() => {
    return intercom.subscribe(msg => {
      switch (msg?.type) {
        case ThanosMessageType.StateUpdated:
          stateSWR.revalidate();
          break;
      }
    });
  }, [stateSWR]);

  /**
   * Aliases
   */

  const { status, accounts, networks } = state;
  const idle = status === ThanosStatus.Idle;
  const locked = status === ThanosStatus.Locked;
  const ready = status === ThanosStatus.Ready;

  /**
   * Actions
   */

  const registerWallet = React.useCallback(
    async (password: string, mnemonic?: string) => {
      const res = await request({
        type: ThanosMessageType.NewWalletRequest,
        password,
        mnemonic
      });
      assertResponse(res.type === ThanosMessageType.NewWalletResponse);
    },
    []
  );

  const unlock = React.useCallback(async (password: string) => {
    const res = await request({
      type: ThanosMessageType.UnlockRequest,
      password
    });
    assertResponse(res.type === ThanosMessageType.UnlockResponse);
  }, []);

  const lock = React.useCallback(async () => {
    const res = await request({
      type: ThanosMessageType.LockRequest
    });
    assertResponse(res.type === ThanosMessageType.LockResponse);
  }, []);

  const createAccount = React.useCallback(async () => {
    const res = await request({
      type: ThanosMessageType.CreateAccountRequest
    });
    assertResponse(res.type === ThanosMessageType.CreateAccountResponse);
  }, []);

  const revealPrivateKey = React.useCallback(
    async (accIndex: number, password: string) => {
      const res = await request({
        type: ThanosMessageType.RevealPrivateKeyRequest,
        accountIndex: accIndex,
        password
      });
      assertResponse(res.type === ThanosMessageType.RevealPrivateKeyResponse);
      return res.privateKey;
    },
    []
  );

  const revealMnemonic = React.useCallback(async (password: string) => {
    const res = await request({
      type: ThanosMessageType.RevealMnemonicRequest,
      password
    });
    assertResponse(res.type === ThanosMessageType.RevealMnemonicResponse);
    return res.mnemonic;
  }, []);

  const editAccountName = React.useCallback(
    async (accIndex: number, name: string) => {
      const res = await request({
        type: ThanosMessageType.EditAccountRequest,
        accountIndex: accIndex,
        name
      });
      assertResponse(res.type === ThanosMessageType.EditAccountResponse);
    },
    []
  );

  const importAccount = React.useCallback(async (privateKey: string) => {
    const res = await request({
      type: ThanosMessageType.ImportAccountRequest,
      privateKey
    });
    assertResponse(res.type === ThanosMessageType.ImportAccountResponse);
  }, []);

  const importFundraiserAccount = React.useCallback(
    async (email: string, password: string, mnemonic: string) => {
      const res = await request({
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

  const createSigner = React.useCallback(
    (accIndex: number, pkh: string) => new ThanosSigner(accIndex, pkh),
    []
  );

  return {
    state,
    // Aliases
    status,
    networks,
    accounts,
    idle,
    locked,
    ready,
    // Actions
    registerWallet,
    unlock,
    lock,
    createAccount,
    revealPrivateKey,
    revealMnemonic,
    editAccountName,
    importAccount,
    importFundraiserAccount,
    createSigner
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
    const res = await request({
      type: ThanosMessageType.RevealPublicKeyRequest,
      accountIndex: this.accIndex
    });
    assertResponse(res.type === ThanosMessageType.RevealPublicKeyResponse);
    return res.publicKey;
  }

  async secretKey(): Promise<string> {
    throw new Error("Secret key cannot be exposed");
  }

  async sign(bytes: string, watermark?: Uint8Array) {
    const res = await request({
      type: ThanosMessageType.SignRequest,
      accountIndex: this.accIndex,
      bytes,
      watermark: buf2hex(toBuffer(watermark))
    });
    assertResponse(res.type === ThanosMessageType.SignResponse);
    return res.result;
  }
}

async function request(req: ThanosRequest) {
  const res = await intercom.request(req);
  assertResponse("type" in res);
  return res as ThanosResponse;
}

function assertResponse(condition: any): asserts condition {
  if (!condition) {
    throw new Error("Invalid response recieved");
  }
}
