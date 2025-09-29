import { useCallback, useEffect, useRef, useState } from 'react';

import { ExchangeClient, HttpTransport, InfoClient, WsWebData2 } from '@nktkas/hyperliquid';
import { AbstractViemLocalAccount } from '@nktkas/hyperliquid/script/src/signing/_signTypedData/viem';
import { Mutex } from 'async-mutex';
import constate from 'constate';
import { TypedDataDefinition } from 'viem';

import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { EVM_ZERO_ADDRESS } from 'lib/constants';
import { useTypedSWR } from 'lib/swr';
import { useTempleClient } from 'lib/temple/front';
import { COMMON_MAINNET_CHAIN_IDS } from 'lib/temple/types';
import { isAccountOfActableType } from 'temple/accounts';
import { useAccountForEvm, useAllEvmChains } from 'temple/front';

import { subscriptionEffectFn } from './subscription-effect-fn';
import { HyperliquidNetworkType } from './types';
import { createSubscriptionClient } from './utils';

class NonceManager {
  /** The last nonce used for signing transactions. */
  private lastNonce = 0;

  get lastReturnedNonce(): number {
    return this.lastNonce;
  }

  /**
   * Gets the next nonce for signing transactions.
   * @returns The next nonce.
   */
  getNonce(): number {
    let nonce = Date.now();
    if (nonce <= this.lastNonce) {
      nonce = ++this.lastNonce;
    } else {
      this.lastNonce = nonce;
    }

    return nonce;
  }
}
export const nonceManager = new NonceManager();

export const nonceActionsMutex = new Mutex();

export const [HyperliquidClientsProvider, useClients] = constate(() => {
  const evmAccount = useAccountForEvm();
  const testnetModeEnabled = useTestnetModeEnabledSelector();
  const { [COMMON_MAINNET_CHAIN_IDS.arbitrum]: arbitrum } = useAllEvmChains();
  const { signEvmTypedData } = useTempleClient();
  const webData2CallbacksRef = useRef<SyncFn<WsWebData2>[]>([]);
  const [subscribedToWebData2, setSubscribedToWebData2] = useState(false);

  const getClients = useCallback(async () => {
    let wallet: AbstractViemLocalAccount | undefined;
    if (evmAccount && isAccountOfActableType(evmAccount)) {
      const account = evmAccount.address as HexString;
      wallet = {
        address: account,
        signTypedData: async params => {
          console.log('signTypedData', params);

          return await signEvmTypedData(params as unknown as TypedDataDefinition, account);
        }
      };
    }

    const subscription = await createSubscriptionClient(testnetModeEnabled);

    return {
      exchange: wallet
        ? new ExchangeClient({
            transport: new HttpTransport({ isTestnet: testnetModeEnabled }),
            wallet,
            nonceManager: nonceManager.getNonce.bind(nonceManager)
          })
        : undefined,
      info: new InfoClient({
        transport: new HttpTransport({ isTestnet: testnetModeEnabled })
      }),
      subscription
    };
  }, [evmAccount, signEvmTypedData, testnetModeEnabled]);

  const { data: clients, mutate } = useTypedSWR(
    ['hyperliquid-client', evmAccount?.address, testnetModeEnabled, arbitrum.rpcBaseURL],
    getClients,
    { suspense: true, revalidateOnFocus: false, revalidateOnMount: true }
  );

  useEffect(() => {
    if (!clients) return;

    return subscriptionEffectFn(
      () =>
        clients.subscription.webData2(
          { user: (evmAccount?.address as HexString | undefined) ?? EVM_ZERO_ADDRESS },
          data => webData2CallbacksRef.current.forEach(cb => cb(data))
        ),
      () => setSubscribedToWebData2(true),
      () => console.log('unsubscribed from webData2', evmAccount?.address)
    );
  }, [clients, evmAccount?.address]);

  const networkType: HyperliquidNetworkType = testnetModeEnabled ? 'testnet' : 'mainnet';

  const addWebData2Listener = useCallback((cb: SyncFn<WsWebData2>) => {
    webData2CallbacksRef.current.push(cb);
  }, []);

  const removeWebData2Listener = useCallback((cb: SyncFn<WsWebData2>) => {
    webData2CallbacksRef.current = webData2CallbacksRef.current.filter(c => c !== cb);
  }, []);

  return {
    clients: clients!,
    regenerateClients: mutate,
    networkType,
    addWebData2Listener,
    removeWebData2Listener,
    subscribedToWebData2
  };
});
