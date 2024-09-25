import { useCallback } from 'react';

import { nanoid } from 'nanoid';

import { ArtificialError } from 'app/defaults';
import { t } from 'lib/i18n';
import { COLORS } from 'lib/ui/colors';
import { loadEvmChainId } from 'temple/evm';
import { OneOfChains, useAllEvmChains, useAllTezosChains, useTempleNetworksActions } from 'temple/front';
import { BlockExplorer, useChainBlockExplorers } from 'temple/front/block-explorers';
import { EvmChainSpecs, TezosChainSpecs, useChainSpecs } from 'temple/front/chains-specs';
import { StoredEvmNetwork, StoredTezosNetwork } from 'temple/networks';
import { loadTezosChainId } from 'temple/tezos';
import { TempleChainKind } from 'temple/types';

import { CreateUrlEntityModalFormValues } from './manage-url-entities-view/create-modal';
import { EditUrlEntityModalFormValues } from './manage-url-entities-view/edit-modal';

export const useChainOperations = (chainKind: TempleChainKind, chainId: string) => {
  const evmChains = useAllEvmChains();
  const tezChains = useAllTezosChains();
  const chain: OneOfChains = evmChains[chainId] ?? tezChains[chainId];
  const [, setChainSpecs, removeChainSpecs] = useChainSpecs(chainKind, chainId);
  const {
    addEvmNetwork,
    addTezosNetwork,
    updateEvmNetwork,
    updateTezosNetwork,
    removeEvmNetworks,
    removeTezosNetworks
  } = useTempleNetworksActions();
  const { addBlockExplorer, replaceBlockExplorer, removeBlockExplorer, removeAllBlockExplorers } =
    useChainBlockExplorers(chainKind, chainId);

  const setChainEnabled = useCallback(
    (newValue: boolean) =>
      setChainSpecs((prevSpecs: TezosChainSpecs | EvmChainSpecs) => ({ ...prevSpecs, disabled: !newValue })),
    [setChainSpecs]
  );

  const setActiveRpcId = useCallback(
    (rpcId: string) =>
      setChainSpecs((prevSpecs: TezosChainSpecs | EvmChainSpecs) => ({ ...prevSpecs, activeRpcId: rpcId })),
    [setChainSpecs]
  );
  const setActiveExplorerId = useCallback(
    (explorerId: string) =>
      setChainSpecs((prevSpecs: TezosChainSpecs | EvmChainSpecs) => ({
        ...prevSpecs,
        activeBlockExplorerId: explorerId
      })),
    [setChainSpecs]
  );

  const assertRpcChainId = useCallback(
    async (url: string) => {
      const actualChainId =
        chainKind === TempleChainKind.Tezos ? await loadTezosChainId(url) : await loadEvmChainId(url);

      if (String(actualChainId) !== chainId) {
        throw new ArtificialError(t('rpcDoesNotMatchChain'));
      }
    },
    [chainId, chainKind]
  );

  const addRpc = useCallback(
    async (values: CreateUrlEntityModalFormValues) => {
      const { name, url, isActive } = values;

      await assertRpcChainId(url);

      const rpcId = nanoid();

      if (chainKind === TempleChainKind.Tezos) {
        await addTezosNetwork({
          name,
          rpcBaseURL: url,
          chainId: String(chainId),
          chain: TempleChainKind.Tezos,
          id: rpcId,
          color: COLORS[Math.floor(Math.random() * COLORS.length)]
        });
      } else {
        await addEvmNetwork({
          name,
          rpcBaseURL: url,
          chainId: Number(chainId),
          chain: TempleChainKind.EVM,
          id: rpcId,
          color: COLORS[Math.floor(Math.random() * COLORS.length)]
        });
      }

      if (isActive) {
        await setActiveRpcId(rpcId);
      }
    },
    [addEvmNetwork, addTezosNetwork, assertRpcChainId, chainId, chainKind, setActiveRpcId]
  );
  const addExplorer = useCallback(
    async (values: CreateUrlEntityModalFormValues) => {
      const { name, url, isActive } = values;

      const { id } = await addBlockExplorer({ name, url });

      if (isActive) {
        await setActiveExplorerId(id);
      }
    },
    [addBlockExplorer, setActiveExplorerId]
  );

  const updateRpc = useCallback(
    async (rpc: StoredTezosNetwork | StoredEvmNetwork, values: EditUrlEntityModalFormValues) => {
      const { name, url } = values;

      try {
        await assertRpcChainId(url);
      } catch (e) {
        console.error(e);
        if (e instanceof ArtificialError) {
          throw e;
        }

        throw new Error(t('rpcDoesNotRespond'));
      }

      if (rpc.chain === TempleChainKind.Tezos) {
        return updateTezosNetwork(rpc.id, { ...rpc, name, rpcBaseURL: url });
      }

      return updateEvmNetwork(rpc.id, { ...rpc, name, rpcBaseURL: url });
    },
    [assertRpcChainId, updateEvmNetwork, updateTezosNetwork]
  );
  const updateExplorer = useCallback(
    ({ id }: BlockExplorer, { name, url }: EditUrlEntityModalFormValues) => replaceBlockExplorer({ id, name, url }),
    [replaceBlockExplorer]
  );

  const removeRpc = useCallback(
    (id: string) => (chainKind === TempleChainKind.Tezos ? removeTezosNetworks([id]) : removeEvmNetworks([id])),
    [chainKind, removeEvmNetworks, removeTezosNetworks]
  );

  const removeChain = useCallback(
    () =>
      Promise.all([
        removeChainSpecs(),
        removeAllBlockExplorers(),
        (chainKind === TempleChainKind.Tezos ? removeTezosNetworks : removeEvmNetworks)(
          chain.allRpcs.map(({ id }) => id)
        )
      ]),
    [chain.allRpcs, chainKind, removeAllBlockExplorers, removeChainSpecs, removeEvmNetworks, removeTezosNetworks]
  );

  return {
    setChainEnabled,
    setActiveRpcId,
    setActiveExplorerId,
    addRpc,
    addExplorer,
    updateRpc,
    updateExplorer,
    removeRpc,
    removeBlockExplorer,
    removeChain
  };
};
