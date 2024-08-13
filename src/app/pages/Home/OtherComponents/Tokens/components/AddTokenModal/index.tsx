import React, { memo, useCallback, useState } from 'react';

import { PageModal } from 'app/atoms/PageModal';
import { useBooleanState } from 'lib/ui/hooks';
import { OneOfChains, useAccountAddressForTezos, useEthereumMainnetChain, useTezosMainnetChain } from 'temple/front';

import { AddTokenForm } from './AddTokenForm';
import { SelectNetworkPage } from './SelectNetworkPage';

interface Props {
  forCollectible: boolean;
  opened: boolean;
  onRequestClose: EmptyFn;
  initialNetwork?: OneOfChains;
}

export const AddTokenModal = memo<Props>(({ forCollectible, opened, onRequestClose, initialNetwork }) => {
  const accountTezAddress = useAccountAddressForTezos();

  const tezosMainnetChain = useTezosMainnetChain();
  const ethMainnetChain = useEthereumMainnetChain();

  const [isNetworkSelectOpened, setNetworkSelectOpened, setNetworkSelectClosed] = useBooleanState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<OneOfChains>(() => {
    if (initialNetwork) return initialNetwork;

    if (accountTezAddress) return tezosMainnetChain;

    return ethMainnetChain;
  });

  const handleNetworkSelect = useCallback(
    (network: OneOfChains) => {
      setSelectedNetwork(network);
      setNetworkSelectClosed();
    },
    [setNetworkSelectClosed]
  );

  return (
    <PageModal
      title={isNetworkSelectOpened ? 'Select Network' : 'Add Custom Token'}
      opened={opened}
      onBackClick={isNetworkSelectOpened ? setNetworkSelectClosed : undefined}
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
          forCollectible={forCollectible}
          selectedNetwork={selectedNetwork}
          onNetworkSelectClick={setNetworkSelectOpened}
          close={onRequestClose}
        />
      )}
    </PageModal>
  );
});
