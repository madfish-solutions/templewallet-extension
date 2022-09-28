import React, { FC, useMemo } from 'react';

import { CustomRpsContext } from 'lib/analytics';
import { FiatCurrencyProvider } from 'lib/fiat-curency';
import { PropsWithChildren } from 'lib/props-with-children';
import { TokensMetadataProvider } from 'lib/temple/front/assets';
import { NewBlockTriggersProvider } from 'lib/temple/front/chain';
import { TempleClientProvider, useTempleClient } from 'lib/temple/front/client';
import { ReadyTempleProvider, useNetwork } from 'lib/temple/front/ready';
import { SyncTokensProvider } from 'lib/temple/front/sync-tokens';
import { USDPriceProvider } from 'lib/temple/front/usdprice';

export const TempleProvider: FC<PropsWithChildren> = ({ children }) => (
  <CustomRpsContext.Provider value={undefined}>
    <TempleClientProvider>
      <ConditionalReadyTemple>{children}</ConditionalReadyTemple>
    </TempleClientProvider>
  </CustomRpsContext.Provider>
);

const ConditionalReadyTemple: FC<PropsWithChildren> = ({ children }) => {
  const { ready } = useTempleClient();

  return useMemo(
    () =>
      ready ? (
        <ReadyTempleProvider>
          <WalletRpcProvider>
            <TokensMetadataProvider>
              <USDPriceProvider>
                <FiatCurrencyProvider>

                      <SyncTokensProvider>
                        <NewBlockTriggersProvider>{children}</NewBlockTriggersProvider>
                      </SyncTokensProvider>

                </FiatCurrencyProvider>
              </USDPriceProvider>
            </TokensMetadataProvider>
          </WalletRpcProvider>
        </ReadyTempleProvider>
      ) : (
        <>{children}</>
      ),
    [children, ready]
  );
};

const WalletRpcProvider: FC<PropsWithChildren> = ({ children }) => {
  const network = useNetwork();

  return <CustomRpsContext.Provider value={network.rpcBaseURL}>{children}</CustomRpsContext.Provider>;
};
