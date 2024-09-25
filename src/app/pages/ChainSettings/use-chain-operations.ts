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
  const activeRpcId = chain.rpc.id;
  const defaultRpcId = chain.allRpcs[0].id;
  const activeBlockExplorerId = chain.activeBlockExplorer?.id;
  const defaultBlockExplorerId = chain.allBlockExplorers[0]?.id;

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
    async (rpc: StoredTezosNetwork | StoredEvmNetwork, { name, url, isActive }: EditUrlEntityModalFormValues) => {
      const wasActive = rpc.id === activeRpcId;
      try {
        await assertRpcChainId(url);
      } catch (e) {
        console.error(e);
        if (e instanceof ArtificialError) {
          throw e;
        }

        throw new Error(t('rpcDoesNotRespond'));
      }

      const newRpcProps = { name, rpcBaseURL: url };

      console.log('oy vey 1', wasActive, isActive, rpc.id, defaultRpcId);
      await Promise.all([
        rpc.chain === TempleChainKind.Tezos
          ? updateTezosNetwork(rpc.id, { ...rpc, ...newRpcProps })
          : updateEvmNetwork(rpc.id, { ...rpc, ...newRpcProps }),
        !wasActive && isActive ? setActiveRpcId(rpc.id) : Promise.resolve(),
        wasActive && !isActive ? setActiveRpcId(defaultRpcId) : Promise.resolve()
      ]);
    },
    [activeRpcId, assertRpcChainId, defaultRpcId, setActiveRpcId, updateEvmNetwork, updateTezosNetwork]
  );
  const updateExplorer = useCallback(
    async ({ id }: BlockExplorer, { name, url, isActive }: EditUrlEntityModalFormValues) => {
      const wasActive = id === activeBlockExplorerId;

      await Promise.all([
        replaceBlockExplorer({ id, name, url }),
        !wasActive && isActive ? setActiveExplorerId(id) : Promise.resolve(),
        wasActive && !isActive ? setActiveExplorerId(defaultBlockExplorerId) : Promise.resolve()
      ]);
    },
    [activeBlockExplorerId, defaultBlockExplorerId, replaceBlockExplorer, setActiveExplorerId]
  );

  const removeRpc = useCallback(
    (id: string) => (chainKind === TempleChainKind.Tezos ? removeTezosNetworks([id]) : removeEvmNetworks([id])),
    [chainKind, removeEvmNetworks, removeTezosNetworks]
  );

  const removeChain = useCallback(() => {
    const rpcIds = chain.allRpcs.map(({ id }) => id);

    return Promise.all([
      removeChainSpecs(),
      removeAllBlockExplorers(),
      chainKind === TempleChainKind.Tezos ? removeTezosNetworks(rpcIds) : removeEvmNetworks(rpcIds)
    ]);
  }, [chain.allRpcs, chainKind, removeAllBlockExplorers, removeChainSpecs, removeEvmNetworks, removeTezosNetworks]);

  return {
    setChainEnabled,
    addRpc,
    addExplorer,
    updateRpc,
    updateExplorer,
    removeRpc,
    removeBlockExplorer,
    removeChain
  };
};
