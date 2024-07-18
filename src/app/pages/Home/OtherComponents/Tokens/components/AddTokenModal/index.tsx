import React, { memo, useCallback, useMemo, useState } from 'react';

import { PageModal } from 'app/atoms/PageModal';
import { useBooleanState } from 'lib/ui/hooks';
import {
  useAccountAddressForEvm,
  useAccountAddressForTezos,
  useEthereumMainnetChain,
  useTezosMainnetChain
} from 'temple/front';

import { AddTokenForm } from './AddTokenForm';
import { SelectedChain, SelectNetworkPage } from './SelectNetworkPage';

interface Props {
  opened: boolean;
  onRequestClose: EmptyFn;
}

export const AddTokenModal = memo<Props>(({ opened, onRequestClose }) => {
  const accountTezAddress = useAccountAddressForTezos();
  const accountEvmAddress = useAccountAddressForEvm();

  const tezosMainnetChain = useTezosMainnetChain();
  const ethMainnetChain = useEthereumMainnetChain();

  const defaultSelectedChain = useMemo(() => {
    if (accountTezAddress && accountEvmAddress) return tezosMainnetChain;
    if (accountTezAddress) return tezosMainnetChain;

    return ethMainnetChain;
  }, [accountEvmAddress, accountTezAddress, ethMainnetChain, tezosMainnetChain]);

  const [isNetworkSelectOpened, setNetworkSelectOpened, setNetworkSelectClosed] = useBooleanState(false);
  const [selectedChain, setSelectedChain] = useState<SelectedChain>(defaultSelectedChain);

  const handleNetworkSelect = useCallback(
    (chain: SelectedChain) => {
      setSelectedChain(chain);
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
          selectedChain={selectedChain}
          onNetworkSelect={handleNetworkSelect}
          onCloseClick={setNetworkSelectClosed}
        />
      ) : (
        <AddTokenForm
          selectedChain={selectedChain}
          onNetworkSelectClick={setNetworkSelectOpened}
          close={onRequestClose}
        />
      )}
    </PageModal>
  );
});
