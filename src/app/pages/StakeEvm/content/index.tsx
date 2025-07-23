import React, { memo, useMemo } from 'react';

import { Berrachain, Ethereum, Polygon } from '@temple-wallet/everstake-wallet-sdk';

import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { getViemTransportForNetwork } from 'temple/evm/utils';
import { useAccountAddressForEvm } from 'temple/front';
import { useEvmChainByChainId } from 'temple/front/chains';

import { BerrachainContent } from './berrachain';
import { EthereumContent } from './ethereum';
import { PolygonContent } from './polygon';

export const StakeEvmPageContent = memo(() => {
  const evmAccountAddress = useAccountAddressForEvm();
  const testnetModeEnabled = useTestnetModeEnabledSelector();

  const berrachain = useEvmChainByChainId(testnetModeEnabled ? 80069 : 80094);
  const berrachainSdk = useMemo(
    () =>
      berrachain
        ? new Berrachain(testnetModeEnabled ? 'testnet' : 'mainnet', getViemTransportForNetwork(berrachain))
        : null,
    [berrachain, testnetModeEnabled]
  );
  const ethereumChain = useEvmChainByChainId(testnetModeEnabled ? 17000 : 1);
  const ethereumSdk = useMemo(
    () =>
      ethereumChain
        ? new Ethereum(testnetModeEnabled ? 'holesky' : 'mainnet', getViemTransportForNetwork(ethereumChain))
        : null,
    [ethereumChain, testnetModeEnabled]
  );
  const polygonSdk = useMemo(
    () => (ethereumChain && !testnetModeEnabled ? new Polygon(getViemTransportForNetwork(ethereumChain)) : null),
    [ethereumChain, testnetModeEnabled]
  );

  if (!evmAccountAddress) {
    return <p>No EVM account address available</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {berrachainSdk ? (
        <BerrachainContent accountAddress={evmAccountAddress} berrachainSdk={berrachainSdk} />
      ) : (
        <p>Please add {testnetModeEnabled ? 'Berachain Bepolia' : 'Berachain'} in networks settings</p>
      )}
      {ethereumSdk ? (
        <EthereumContent accountAddress={evmAccountAddress} ethereumSdk={ethereumSdk} />
      ) : (
        <p>Please add {testnetModeEnabled ? 'Ethereum Holesky' : 'Ethereum'} in networks settings</p>
      )}
      {!testnetModeEnabled && <PolygonContent accountAddress={evmAccountAddress} polygonSdk={polygonSdk!} />}
    </div>
  );
});
