import React, { memo, useCallback, useMemo, useState } from 'react';

import { PageModal } from 'app/atoms/PageModal';
import { useBooleanState } from 'lib/ui/hooks';
import {
  EvmChain,
  TezosChain,
  useAccountAddressForEvm,
  useAccountAddressForTezos,
  useEthereumMainnetChain,
  useTezosMainnetChain
} from 'temple/front';

import { AddTokenForm } from './AddTokenForm';
import { SelectNetworkPage } from './SelectNetworkPage';

type Network = EvmChain | TezosChain;

interface Props {
  opened: boolean;
  onRequestClose: EmptyFn;
}

export const AddTokenModal = memo<Props>(({ opened, onRequestClose }) => {
  const accountTezAddress = useAccountAddressForTezos();
  const accountEvmAddress = useAccountAddressForEvm();

  const tezosMainnetChain = useTezosMainnetChain();
  const ethMainnetChain = useEthereumMainnetChain();

  const defaultSelectedNetwork = useMemo(() => {
    if (accountTezAddress && accountEvmAddress) return tezosMainnetChain;
    if (accountTezAddress) return tezosMainnetChain;

    return ethMainnetChain;
  }, [accountEvmAddress, accountTezAddress, ethMainnetChain, tezosMainnetChain]);

  const [isNetworkSelectOpened, setNetworkSelectOpened, setNetworkSelectClosed] = useBooleanState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<Network>(defaultSelectedNetwork);

  const handleNetworkSelect = useCallback(
    (network: Network) => {
      setSelectedNetwork(network);
      setNetworkSelectClosed();
    },
    [setNetworkSelectClosed]
  );

  return (
    <PageModal
      title={isNetworkSelectOpened ? 'Select Network' : 'Add Custom Token'}
      opened={opened}
      onGoBack={isNetworkSelectOpened ? setNetworkSelectClosed : undefined}
      onRequestClose={onRequestClose}
    >
      {isNetworkSelectOpened ? (
        <SelectNetworkPage
          selectedNetwork={selectedNetwork}
          onNetworkSelect={handleNetworkSelect}
          onCloseClick={setNetworkSelectClosed}
        />
      ) : (
        <AddTokenForm
          selectedNetwork={selectedNetwork}
          onNetworkSelectClick={setNetworkSelectOpened}
          close={onRequestClose}
        />
      )}
    </PageModal>
  );
});
