import React, { memo, useCallback, useState } from 'react';

import { PageModal } from 'app/atoms/PageModal';
import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { T } from 'lib/i18n';
import { useBooleanState } from 'lib/ui/hooks';
import { OneOfChains, useAccountAddressForTezos, useEthereumMainnetChain, useTezosMainnetChain } from 'temple/front';
import { useEthereumTestnetChain, useTezosTestnetChain } from 'temple/front/chains';

import { AddTokenForm } from './AddTokenForm';
import { SelectNetworkPage } from './SelectNetworkPage';

interface Props {
  forCollectible: boolean;
  opened: boolean;
  onRequestClose: EmptyFn;
  initialNetwork?: OneOfChains;
}

export const AddTokenModal = memo<Props>(({ forCollectible, opened, onRequestClose, initialNetwork }) => {
  const testnetModeEnabled = useTestnetModeEnabledSelector();
  const accountTezAddress = useAccountAddressForTezos();

  const tezosMainnetChain = useTezosMainnetChain();
  const tezosTestnetChain = useTezosTestnetChain();

  const ethMainnetChain = useEthereumMainnetChain();
  const ethTestnetChain = useEthereumTestnetChain();

  const [isNetworkSelectOpened, setNetworkSelectOpened, setNetworkSelectClosed] = useBooleanState(false);

  const [selectedNetwork, setSelectedNetwork] = useState<OneOfChains>(() => {
    if (initialNetwork) return initialNetwork;

    if (accountTezAddress) return testnetModeEnabled ? tezosTestnetChain : tezosMainnetChain;

    return testnetModeEnabled ? ethTestnetChain : ethMainnetChain;
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
      title={<T id={isNetworkSelectOpened ? 'selectNetwork' : 'addTokenNonCapitalize'} />}
      opened={opened}
      onGoBack={isNetworkSelectOpened ? setNetworkSelectClosed : undefined}
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
