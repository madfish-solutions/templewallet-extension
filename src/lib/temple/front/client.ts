import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  WalletProvider,
  createOriginationOperation,
  createSetDelegateOperation,
  createIncreasePaidStorageOperation,
  createTransferOperation,
  WalletDelegateParams,
  WalletOriginateParams,
  WalletIncreasePaidStorageParams,
  WalletTransferParams,
  Signer
} from '@taquito/taquito';
import { buf2hex } from '@taquito/utils';
import constate from 'constate';
import { nanoid } from 'nanoid';
import toBuffer from 'typedarray-to-buffer';

import { IntercomClient } from 'lib/intercom';
import { useRetryableSWR } from 'lib/swr';
import { clearLocalStorage } from 'lib/temple/reset';
import {
  TempleConfirmationPayload,
  TempleMessageType,
  TempleStatus,
  TempleRequest,
  TempleResponse,
  TempleNotification,
  TempleSettings,
  DerivationType
} from 'lib/temple/types';

type Confirmation = {
  id: string;
  payload: TempleConfirmationPayload;
  error?: any;
};

export const intercom = new IntercomClient();

export const [TempleClientProvider, useTempleClient] = constate(() => {
  /**
   * State
   */

  const fetchState = useCallback(async () => {
    const res = await request({ type: TempleMessageType.GetStateRequest });
    assertResponse(res.type === TempleMessageType.GetStateResponse);
    return res.state;
  }, []);

  const { data, mutate } = useRetryableSWR('state', fetchState, {
    suspense: true,
    shouldRetryOnError: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });
  const state = data!;

  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const confirmationIdRef = useRef<string | null>(null);
  const resetConfirmation = useCallback(() => {
    confirmationIdRef.current = null;
    setConfirmation(null);
  }, [setConfirmation]);

  useEffect(() => {
    return intercom.subscribe((msg: TempleNotification) => {
      switch (msg?.type) {
        case TempleMessageType.StateUpdated:
          mutate();
          break;

        case TempleMessageType.ConfirmationRequested:
          if (msg.id === confirmationIdRef.current) {
            setConfirmation({ id: msg.id, payload: msg.payload, error: msg.error });
          }
          break;

        case TempleMessageType.ConfirmationExpired:
          if (msg.id === confirmationIdRef.current) {
            resetConfirmation();
          }
          break;
      }
    });
  }, [mutate, setConfirmation, resetConfirmation]);

  /**
   * Aliases
   */

  const { status, networks: defaultNetworks, accounts, settings } = state;
  const idle = status === TempleStatus.Idle;
  const locked = status === TempleStatus.Locked;
  const ready = status === TempleStatus.Ready;

  const customNetworks = useMemo(() => settings?.customNetworks ?? [], [settings]);
  const networks = useMemo(() => [...defaultNetworks, ...customNetworks], [defaultNetworks, customNetworks]);

  /**
   * Actions
   */

  const registerWallet = useCallback(async (password: string, mnemonic?: string) => {
    const res = await request({
      type: TempleMessageType.NewWalletRequest,
      password,
      mnemonic
    });
    assertResponse(res.type === TempleMessageType.NewWalletResponse);
    clearLocalStorage(['onboarding', 'analytics']);

    return res.accountPkh;
  }, []);

  const unlock = useCallback(async (password: string) => {
    const res = await request({
      type: TempleMessageType.UnlockRequest,
      password
    });
    assertResponse(res.type === TempleMessageType.UnlockResponse);
  }, []);

  const lock = useCallback(async () => {
    const res = await request({
      type: TempleMessageType.LockRequest
    });
    assertResponse(res.type === TempleMessageType.LockResponse);
  }, []);

  const createAccount = useCallback(async (name?: string) => {
    const res = await request({
      type: TempleMessageType.CreateAccountRequest,
      name
    });
    assertResponse(res.type === TempleMessageType.CreateAccountResponse);
  }, []);

  const revealPrivateKey = useCallback(async (accountPublicKeyHash: string, password: string) => {
    const res = await request({
      type: TempleMessageType.RevealPrivateKeyRequest,
      accountPublicKeyHash,
      password
    });
    assertResponse(res.type === TempleMessageType.RevealPrivateKeyResponse);
    return res.privateKey;
  }, []);

  const revealMnemonic = useCallback(async (password: string) => {
    const res = await request({
      type: TempleMessageType.RevealMnemonicRequest,
      password
    });
    assertResponse(res.type === TempleMessageType.RevealMnemonicResponse);
    return res.mnemonic;
  }, []);

  const generateSyncPayload = useCallback(async (password: string) => {
    const res = await request({
      type: TempleMessageType.GenerateSyncPayloadRequest,
      password
    });
    assertResponse(res.type === TempleMessageType.GenerateSyncPayloadResponse);
    return res.payload;
  }, []);

  const removeAccount = useCallback(async (accountPublicKeyHash: string, password: string) => {
    const res = await request({
      type: TempleMessageType.RemoveAccountRequest,
      accountPublicKeyHash,
      password
    });
    assertResponse(res.type === TempleMessageType.RemoveAccountResponse);
  }, []);

  const editAccountName = useCallback(async (accountPublicKeyHash: string, name: string) => {
    const res = await request({
      type: TempleMessageType.EditAccountRequest,
      accountPublicKeyHash,
      name
    });
    assertResponse(res.type === TempleMessageType.EditAccountResponse);
  }, []);

  const importAccount = useCallback(async (privateKey: string, encPassword?: string) => {
    const res = await request({
      type: TempleMessageType.ImportAccountRequest,
      privateKey,
      encPassword
    });
    assertResponse(res.type === TempleMessageType.ImportAccountResponse);
  }, []);

  const importMnemonicAccount = useCallback(async (mnemonic: string, password?: string, derivationPath?: string) => {
    const res = await request({
      type: TempleMessageType.ImportMnemonicAccountRequest,
      mnemonic,
      password,
      derivationPath
    });
    assertResponse(res.type === TempleMessageType.ImportMnemonicAccountResponse);
  }, []);

  const importFundraiserAccount = useCallback(async (email: string, password: string, mnemonic: string) => {
    const res = await request({
      type: TempleMessageType.ImportFundraiserAccountRequest,
      email,
      password,
      mnemonic
    });
    assertResponse(res.type === TempleMessageType.ImportFundraiserAccountResponse);
  }, []);

  const importKTManagedAccount = useCallback(async (address: string, chainId: string, owner: string) => {
    const res = await request({
      type: TempleMessageType.ImportManagedKTAccountRequest,
      address,
      chainId,
      owner
    });
    assertResponse(res.type === TempleMessageType.ImportManagedKTAccountResponse);
  }, []);

  const importWatchOnlyAccount = useCallback(async (address: string, chainId?: string) => {
    const res = await request({
      type: TempleMessageType.ImportWatchOnlyAccountRequest,
      address,
      chainId
    });
    assertResponse(res.type === TempleMessageType.ImportWatchOnlyAccountResponse);
  }, []);

  const createLedgerAccount = useCallback(
    async (name: string, derivationType?: DerivationType, derivationPath?: string) => {
      const res = await request({
        type: TempleMessageType.CreateLedgerAccountRequest,
        name,
        derivationPath,
        derivationType
      });
      assertResponse(res.type === TempleMessageType.CreateLedgerAccountResponse);
    },
    []
  );

  const updateSettings = useCallback(async (newSettings: Partial<TempleSettings>) => {
    const res = await request({
      type: TempleMessageType.UpdateSettingsRequest,
      settings: newSettings
    });
    assertResponse(res.type === TempleMessageType.UpdateSettingsResponse);
  }, []);

  const confirmInternal = useCallback(
    async (id: string, confirmed: boolean, modifiedTotalFee?: number, modifiedStorageLimit?: number) => {
      const res = await request({
        type: TempleMessageType.ConfirmationRequest,
        id,
        confirmed,
        modifiedTotalFee,
        modifiedStorageLimit
      });
      assertResponse(res.type === TempleMessageType.ConfirmationResponse);
    },
    []
  );

  const getDAppPayload = useCallback(async (id: string) => {
    const res = await request({
      type: TempleMessageType.DAppGetPayloadRequest,
      id
    });
    assertResponse(res.type === TempleMessageType.DAppGetPayloadResponse);
    return res.payload;
  }, []);

  const confirmDAppPermission = useCallback(async (id: string, confirmed: boolean, pkh: string) => {
    const res = await request({
      type: TempleMessageType.DAppPermConfirmationRequest,
      id,
      confirmed,
      accountPublicKeyHash: pkh,
      accountPublicKey: confirmed ? await getPublicKey(pkh) : ''
    });
    assertResponse(res.type === TempleMessageType.DAppPermConfirmationResponse);
  }, []);

  const confirmDAppOperation = useCallback(
    async (id: string, confirmed: boolean, modifiedTotalFee?: number, modifiedStorageLimit?: number) => {
      const res = await request({
        type: TempleMessageType.DAppOpsConfirmationRequest,
        id,
        confirmed,
        modifiedTotalFee,
        modifiedStorageLimit
      });
      assertResponse(res.type === TempleMessageType.DAppOpsConfirmationResponse);
    },
    []
  );

  const confirmDAppSign = useCallback(async (id: string, confirmed: boolean) => {
    const res = await request({
      type: TempleMessageType.DAppSignConfirmationRequest,
      id,
      confirmed
    });
    assertResponse(res.type === TempleMessageType.DAppSignConfirmationResponse);
  }, []);

  const createTaquitoWallet = useCallback(
    (sourcePkh: string, networkRpc: string) =>
      new TaquitoWallet(sourcePkh, networkRpc, {
        onBeforeSend: id => {
          confirmationIdRef.current = id;
        }
      }),
    []
  );

  const createTaquitoSigner = useCallback(
    (sourcePkh: string) =>
      new TempleSigner(sourcePkh, id => {
        confirmationIdRef.current = id;
      }),
    []
  );

  const getAllDAppSessions = useCallback(async () => {
    const res = await request({
      type: TempleMessageType.DAppGetAllSessionsRequest
    });
    assertResponse(res.type === TempleMessageType.DAppGetAllSessionsResponse);
    return res.sessions;
  }, []);

  const removeDAppSession = useCallback(async (origin: string) => {
    const res = await request({
      type: TempleMessageType.DAppRemoveSessionRequest,
      origin
    });
    assertResponse(res.type === TempleMessageType.DAppRemoveSessionResponse);
    return res.sessions;
  }, []);

  return {
    state,

    // Aliases
    status,
    defaultNetworks,
    customNetworks,
    networks,
    accounts,
    settings,
    idle,
    locked,
    ready,

    // Misc
    confirmation,
    resetConfirmation,

    // Actions
    registerWallet,
    unlock,
    lock,
    createAccount,
    revealPrivateKey,
    revealMnemonic,
    generateSyncPayload,
    removeAccount,
    editAccountName,
    importAccount,
    importMnemonicAccount,
    importFundraiserAccount,
    importKTManagedAccount,
    importWatchOnlyAccount,
    createLedgerAccount,
    updateSettings,
    confirmInternal,
    getDAppPayload,
    confirmDAppPermission,
    confirmDAppOperation,
    confirmDAppSign,
    createTaquitoWallet,
    createTaquitoSigner,
    getAllDAppSessions,
    removeDAppSession
  };
});

type TaquitoWalletOps = {
  onBeforeSend?: (id: string) => void;
};

class TaquitoWallet implements WalletProvider {
  constructor(private pkh: string, private rpc: string, private opts: TaquitoWalletOps = {}) {}

  async getPKH() {
    return this.pkh;
  }

  getPK() {
    return getPublicKey(this.pkh);
  }

  async mapIncreasePaidStorageWalletParams(params: () => Promise<WalletIncreasePaidStorageParams>) {
    const walletParams = await params();
    return withoutFeesOverride(walletParams, await createIncreasePaidStorageOperation(walletParams));
  }

  async mapTransferParamsToWalletParams(params: () => Promise<WalletTransferParams>) {
    const walletParams = await params();
    return withoutFeesOverride(walletParams, await createTransferOperation(walletParams));
  }

  async mapOriginateParamsToWalletParams(params: () => Promise<WalletOriginateParams>) {
    const walletParams = await params();
    return withoutFeesOverride(walletParams, await createOriginationOperation(walletParams));
  }

  async mapDelegateParamsToWalletParams(params: () => Promise<WalletDelegateParams>) {
    const walletParams = await params();
    return withoutFeesOverride(walletParams, await createSetDelegateOperation(walletParams as any));
  }

  async sendOperations(opParams: any[]) {
    const id = nanoid();
    if (this.opts.onBeforeSend) {
      this.opts.onBeforeSend(id);
    }
    const res = await request({
      type: TempleMessageType.OperationsRequest,
      id,
      sourcePkh: this.pkh,
      networkRpc: this.rpc,
      opParams: opParams.map(formatOpParams)
    });
    assertResponse(res.type === TempleMessageType.OperationsResponse);
    return res.opHash;
  }

  async sign(): Promise<string> {
    throw new Error('Cannot sign');
  }
}

class TempleSigner implements Signer {
  constructor(private pkh: string, private onBeforeSign?: (id: string) => void) {}

  async publicKeyHash() {
    return this.pkh;
  }

  async publicKey(): Promise<string> {
    return getPublicKey(this.pkh);
  }

  async secretKey(): Promise<string> {
    throw new Error('Secret key cannot be exposed');
  }

  async sign(bytes: string, watermark?: Uint8Array) {
    const id = nanoid();
    if (this.onBeforeSign) {
      this.onBeforeSign(id);
    }
    const res = await request({
      type: TempleMessageType.SignRequest,
      sourcePkh: this.pkh,
      id,
      bytes,
      watermark: watermark ? buf2hex(toBuffer(watermark)) : undefined
    });
    assertResponse(res.type === TempleMessageType.SignResponse);
    return res.result;
  }
}

function formatOpParams(op: any) {
  switch (op.kind) {
    case 'origination':
      return {
        ...op,
        mutez: true // The balance was already converted from Tez (ꜩ) to Mutez (uꜩ)
      };
    case 'transaction':
      const { destination, amount, parameters, ...txRest } = op;
      return {
        ...txRest,
        to: destination,
        amount: +amount,
        mutez: true,
        parameter: parameters
      };
    default:
      return op;
  }
}

async function getPublicKey(accountPublicKeyHash: string) {
  const res = await request({
    type: TempleMessageType.RevealPublicKeyRequest,
    accountPublicKeyHash
  });
  assertResponse(res.type === TempleMessageType.RevealPublicKeyResponse);
  return res.publicKey;
}

export async function request<T extends TempleRequest>(req: T) {
  const res = await intercom.request(req);
  assertResponse('type' in res);
  return res as TempleResponse;
}

export function assertResponse(condition: any): asserts condition {
  if (!condition) {
    throw new Error('Invalid response recieved');
  }
}

function withoutFeesOverride<T>(params: any, op: T): T {
  try {
    const { fee, gasLimit, storageLimit } = params;
    return {
      ...op,
      fee,
      gas_limit: gasLimit,
      storage_limit: storageLimit
    };
  } catch {
    return params;
  }
}
