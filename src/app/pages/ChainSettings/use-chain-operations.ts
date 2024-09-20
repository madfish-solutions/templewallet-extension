import { useCallback } from 'react';

import { nanoid } from 'nanoid';

import { ArtificialError } from 'app/defaults';
import { t } from 'lib/i18n';
import { COLORS } from 'lib/ui/colors';
import { getReadOnlyEvm } from 'temple/evm';
import { useTempleNetworksActions } from 'temple/front';
import { BlockExplorer, useChainBlockExplorers } from 'temple/front/block-explorers';
import { EvmChainSpecs, TezosChainSpecs, useChainSpecs } from 'temple/front/chains-specs';
import { StoredEvmNetwork, StoredTezosNetwork } from 'temple/networks';
import { getReadOnlyTezos } from 'temple/tezos';
import { TempleChainKind } from 'temple/types';

import { CreateUrlEntityModalFormValues } from './manage-url-entities-view/create-modal';
import { EditUrlEntityModalFormValues } from './manage-url-entities-view/edit-modal';

export const useChainOperations = (chainKind: TempleChainKind, chainId: string) => {
  const [, setChainSpecs] = useChainSpecs(chainKind, chainId);
  const { addEvmNetwork, addTezosNetwork, updateEvmNetwork, updateTezosNetwork, removeEvmNetwork, removeTezosNetwork } =
    useTempleNetworksActions();
  const { addBlockExplorer, replaceBlockExplorer, removeBlockExplorer } = useChainBlockExplorers(chainKind, chainId);

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

  const getRpcChainId = useCallback(
    (url: string) =>
      chainKind === TempleChainKind.Tezos ? getReadOnlyTezos(url).rpc.getChainId() : getReadOnlyEvm(url).getChainId(),
    [chainKind]
  );
  const assertRpcChainId = useCallback(
    async (url: string) => {
      const actualChainId = await getRpcChainId(url);

      if (String(actualChainId) !== chainId) {
        throw new ArtificialError(t('rpcDoesNotMatchChain'));
      }
    },
    [chainId, getRpcChainId]
  );

  const addRpc = useCallback(
    async (values: CreateUrlEntityModalFormValues) => {
      const { name, url, isActive } = values;

      const chainId = await getRpcChainId(url);
      const rpcId = nanoid();

      if (chainKind === TempleChainKind.Tezos) {
        await addTezosNetwork({
          name,
          rpcBaseURL: url,
          chainId: chainId as string,
          chain: TempleChainKind.Tezos,
          id: rpcId,
          color: COLORS[Math.floor(Math.random() * COLORS.length)]
        });
      } else {
        await addEvmNetwork({
          name,
          rpcBaseURL: url,
          chainId: chainId as number,
          chain: TempleChainKind.EVM,
          id: rpcId,
          color: COLORS[Math.floor(Math.random() * COLORS.length)]
        });
      }

      if (isActive) {
        await setActiveRpcId(rpcId);
      }
    },
    [addEvmNetwork, addTezosNetwork, chainKind, getRpcChainId, setActiveRpcId]
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
    (id: string) => (chainKind === TempleChainKind.Tezos ? removeTezosNetwork(id) : removeEvmNetwork(id)),
    [chainKind, removeEvmNetwork, removeTezosNetwork]
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
    removeBlockExplorer
  };
};
