import React, { memo, useCallback, useState } from 'react';

import { BackButton, PageModal } from 'app/atoms/PageModal';
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

  const totalClose = useCallback(() => {
    setNetworkSelectClosed();
    onRequestClose();
  }, [onRequestClose, setNetworkSelectClosed]);

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
      titleLeft={isNetworkSelectOpened ? <BackButton onClick={setNetworkSelectClosed} /> : undefined}
      onRequestClose={totalClose}
    >
      {isNetworkSelectOpened ? (
        <SelectNetworkPage selectedNetwork={selectedNetwork} onNetworkSelect={handleNetworkSelect} />
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
