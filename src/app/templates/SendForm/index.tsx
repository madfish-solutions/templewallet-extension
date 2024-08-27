import React, { memo, Suspense, useCallback, useState } from 'react';

import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { useEnabledTezosChainAccountTokenSlugs } from 'lib/assets/hooks';
import { useTezosChainAccountTokensSortPredicate } from 'lib/assets/use-sorting';
import { useBooleanState, useMemoWithCompare } from 'lib/ui/hooks';
import { AccountForTezos } from 'temple/accounts';
import { TezosNetworkEssentials } from 'temple/networks';

import AddContactModal from './AddContactModal';
import { Form } from './Form';
import { SelectAssetModal } from './SelectAssetModal';
import { SpinnerSection } from './SpinnerSection';

interface Props {
  network: TezosNetworkEssentials;
  tezosAccount: AccountForTezos;
  assetSlug?: string | null;
}

const SendForm = memo<Props>(({ network, tezosAccount, assetSlug = TEZ_TOKEN_SLUG }) => {
  const tezosChainId = network.chainId;
  const publicKeyHash = tezosAccount.address;

  const [selectTokenModalOpened, setSelectTokenModalOpen, setSelectTokenModalClosed] = useBooleanState(false);

  const tokensSlugs = useEnabledTezosChainAccountTokenSlugs(publicKeyHash, tezosChainId);

  const tokensSortPredicate = useTezosChainAccountTokensSortPredicate(publicKeyHash, tezosChainId);

  const assetsSlugs = useMemoWithCompare<string[]>(() => {
    const sortedSlugs = Array.from(tokensSlugs).sort(tokensSortPredicate);

    if (!assetSlug || assetSlug === TEZ_TOKEN_SLUG) return [TEZ_TOKEN_SLUG, ...sortedSlugs];

    return sortedSlugs.some(s => s === assetSlug)
      ? [TEZ_TOKEN_SLUG, ...sortedSlugs]
      : [TEZ_TOKEN_SLUG, assetSlug, ...sortedSlugs];
  }, [tokensSortPredicate, tokensSlugs, assetSlug]);

  const selectedAsset = assetSlug ?? TEZ_TOKEN_SLUG;

  const [addContactModalAddress, setAddContactModalAddress] = useState<string | null>(null);

  const handleAddContactRequested = useCallback(
    (address: string) => {
      setAddContactModalAddress(address);
    },
    [setAddContactModalAddress]
  );

  const closeContactModal = useCallback(() => {
    setAddContactModalAddress(null);
  }, [setAddContactModalAddress]);

  return (
    <>
      <Suspense fallback={<SpinnerSection />}>
        <Form
          account={tezosAccount}
          network={network}
          assetSlug={selectedAsset}
          onSelectTokenClick={setSelectTokenModalOpen}
          onAddContactRequested={handleAddContactRequested}
        />
      </Suspense>

      <SelectAssetModal opened={selectTokenModalOpened} onRequestClose={setSelectTokenModalClosed} />
      <AddContactModal address={addContactModalAddress} onClose={closeContactModal} />
    </>
  );
});

export default SendForm;
