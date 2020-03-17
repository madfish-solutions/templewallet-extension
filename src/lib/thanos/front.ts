import * as React from "react";
import constate from "constate";
import useSWR from "swr";
import { TezosToolkit } from "@taquito/taquito";
import { IntercomClient } from "lib/intercom";
import usePassiveStorage from "lib/thanos/front/usePassiveStorage";
import {
  ThanosMessageType,
  ThanosStatus,
  ThanosRequest,
  ThanosResponse
} from "lib/thanos/types";

type Request = (req: ThanosRequest) => Promise<ThanosResponse>;

export const [ThanosFrontProvider, useThanosFront] = constate(() => {
  const intercom = React.useMemo(() => new IntercomClient(), []);

  const request = React.useCallback<Request>(
    async req => {
      const res = await intercom.request(req);
      assertResponse("type" in res);
      return res as ThanosResponse;
    },
    [intercom]
  );

  const fetchState = React.useCallback(async () => {
    const res = await request({ type: ThanosMessageType.GetStateRequest });
    assertResponse(res.type === ThanosMessageType.GetStateResponse);
    return res.state;
  }, [request]);

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
  }, [intercom, stateSWR]);

  const { status, accounts, networks } = state;
  const idle = status === ThanosStatus.Idle;
  const locked = status === ThanosStatus.Locked;
  const ready = status === ThanosStatus.Ready;

  const [netIndex, setNetIndex] = usePassiveStorage("network_id", 0);
  const network = networks[netIndex];

  const [accIndex, setAccIndex] = usePassiveStorage("account_index", 0);
  const account = accounts[accIndex];
  const accountPkh = account?.publicKeyHash;

  const tezos = React.useMemo(() => {
    if (!accountPkh) {
      return null;
    }

    const t = new TezosToolkit();
    const rpc = network.rpcBaseURL;
    const signer = new ThanosSigner(accIndex, accountPkh, request);
    t.setProvider({ rpc, signer });
    return t;
  }, [network.rpcBaseURL, accIndex, accountPkh, request]);

  React.useEffect(() => {
    if (accIndex >= accounts.length) {
      setAccIndex(0);
    }
  }, [accounts, accIndex, setAccIndex]);

  const registerWallet = React.useCallback(
    async (password: string, mnemonic?: string) => {
      const res = await request({
        type: ThanosMessageType.NewWalletRequest,
        password,
        mnemonic
      });
      assertResponse(res.type === ThanosMessageType.NewWalletResponse);
    },
    [request]
  );

  const unlock = React.useCallback(
    async (password: string) => {
      const res = await request({
        type: ThanosMessageType.UnlockRequest,
        password
      });
      assertResponse(res.type === ThanosMessageType.UnlockResponse);
    },
    [request]
  );

  const lock = React.useCallback(async () => {
    const res = await request({
      type: ThanosMessageType.LockRequest
    });
    assertResponse(res.type === ThanosMessageType.LockResponse);
  }, [request]);

  const createAccount = React.useCallback(async () => {
    const res = await request({
      type: ThanosMessageType.CreateAccountRequest
    });
    assertResponse(res.type === ThanosMessageType.CreateAccountResponse);
  }, [request]);

  const revealPrivateKey = React.useCallback(
    async (password: string) => {
      const res = await request({
        type: ThanosMessageType.RevealPrivateKeyRequest,
        accountIndex: accIndex,
        password
      });
      assertResponse(res.type === ThanosMessageType.RevealPrivateKeyResponse);
      return res.privateKey;
    },
    [request, accIndex]
  );

  const revealMnemonic = React.useCallback(
    async (password: string) => {
      const res = await request({
        type: ThanosMessageType.RevealMnemonicRequest,
        password
      });
      assertResponse(res.type === ThanosMessageType.RevealMnemonicResponse);
      return res.mnemonic;
    },
    [request]
  );

  const editAccountName = React.useCallback(
    async (name: string) => {
      const res = await request({
        type: ThanosMessageType.EditAccountRequest,
        accountIndex: accIndex,
        name
      });
      assertResponse(res.type === ThanosMessageType.EditAccountResponse);
    },
    [request, accIndex]
  );

  const importAccount = React.useCallback(
    async (privateKey: string) => {
      const res = await request({
        type: ThanosMessageType.ImportAccountRequest,
        privateKey
      });
      assertResponse(res.type === ThanosMessageType.ImportAccountResponse);
    },
    [request]
  );

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
    [request]
  );

  return {
    status,
    idle,
    locked,
    ready,
    networks,
    netIndex,
    setNetIndex,
    network,
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
  private request: Request;

  constructor(accIndex: number, pkh: string, request: Request) {
    this.accIndex = accIndex;
    this.pkh = pkh;
    this.request = request;
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
    const res = await this.request({
      type: ThanosMessageType.SignRequest,
      accountIndex: this.accIndex,
      bytes,
      watermark
    });
    assertResponse(res.type === ThanosMessageType.SignResponse);
    return res.result;
  }
}

const NO_RES_ERROR_MESSAGE = "Invalid response recieved";

function assertResponse(condition: any): asserts condition {
  if (!condition) {
    throw new Error(NO_RES_ERROR_MESSAGE);
  }
}
