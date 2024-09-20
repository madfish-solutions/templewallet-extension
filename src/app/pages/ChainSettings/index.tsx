import React, { memo, useCallback, useMemo } from 'react';

import { ToggleSwitch } from 'app/atoms';
import { SettingsCell } from 'app/atoms/SettingsCell';
import { SettingsCellGroup } from 'app/atoms/SettingsCellGroup';
import PageLayout from 'app/layouts/PageLayout';
import { T, t } from 'lib/i18n';
import {
  AdditionalChainsPropsContextProvider,
  useAdditionalChainsPropsContext
} from 'lib/temple/front/additional-chains-props-context';
import {
  EvmChain,
  TezosChain,
  useAllEvmChains,
  useAllTezosChains,
  useEnabledEvmChains,
  useEnabledTezosChains
} from 'temple/front';
import { BlockExplorer, DEFAULT_BLOCK_EXPLORERS } from 'temple/front/block-explorers';
import { EVM_DEFAULT_NETWORKS, StoredEvmNetwork, StoredTezosNetwork, TEZOS_DEFAULT_NETWORKS } from 'temple/networks';
import { TempleChainKind } from 'temple/types';

import { ManageUrlEntitiesView } from './manage-url-entities-view';
import { ChainSettingsSelectors } from './selectors';
import { useChainOperations } from './use-chain-operations';

interface ChainSettingsProps {
  chainKind: TempleChainKind;
  chainId: string;
}

const rpcUrlFn = (item: { rpcBaseURL: string }) => item.rpcBaseURL;
const explorerUrlFn = (item: { url: string }) => item.url;

const ChainSettingsBody = memo<ChainSettingsProps>(props => {
  const { chainId, chainKind } = props;
  const { isMainnet } = useAdditionalChainsPropsContext();
  const enabledEvmChains = useEnabledEvmChains();
  const evmChains = useAllEvmChains();
  const enabledTezChains = useEnabledTezosChains();
  const tezChains = useAllTezosChains();
  const chain: EvmChain | TezosChain = evmChains[chainId] ?? tezChains[chainId];
  const {
    setChainEnabled,
    setActiveRpcId,
    setActiveExplorerId,
    addRpc,
    addExplorer,
    updateRpc,
    updateExplorer,
    removeRpc,
    removeBlockExplorer
  } = useChainOperations(chainKind, chainId);

  const isRpcEditable = useCallback(
    (rpc: StoredEvmNetwork | StoredTezosNetwork) => {
      const sameKindDefaultNetworks =
        chainKind === TempleChainKind.Tezos ? TEZOS_DEFAULT_NETWORKS : EVM_DEFAULT_NETWORKS;

      return !sameKindDefaultNetworks.some(n => n.id === rpc.id);
    },
    [chainKind]
  );
  const isExplorerEditable = useCallback(
    (explorer: BlockExplorer) => {
      const sameChainDefaultExplorers = DEFAULT_BLOCK_EXPLORERS[chainKind][chainId];

      return !sameChainDefaultExplorers.some(e => e.id === explorer.id);
    },
    [chainId, chainKind]
  );
  const isRpcRemovable = useCallback(
    (rpc: StoredEvmNetwork | StoredTezosNetwork) => isRpcEditable(rpc) && chain.allRpcs.length > 1,
    [chain.allRpcs.length, isRpcEditable]
  );
  const isExplorerRemovable = useCallback(
    (explorer: BlockExplorer) => isExplorerEditable(explorer) && chain.allBlockExplorers.length > 1,
    [chain.allBlockExplorers.length, isExplorerEditable]
  );

  const enabledMainnetChains = useMemo(
    () => [...enabledEvmChains, ...enabledTezChains].filter(chain => isMainnet(chain.kind, chain.chainId)),
    [enabledEvmChains, enabledTezChains, isMainnet]
  );
  const enabledTestnetChains = useMemo(
    () => [...enabledEvmChains, ...enabledTezChains].filter(chain => !isMainnet(chain.kind, chain.chainId)),
    [enabledEvmChains, enabledTezChains, isMainnet]
  );

  const shouldPreventDisablingChain = isMainnet(chainKind, chainId)
    ? enabledMainnetChains.length === 1
    : enabledTestnetChains.length === 1;

  return (
    <PageLayout pageTitle={chain.nameI18nKey ? <T id={chain.nameI18nKey} /> : chain.name}>
      <div className="flex flex-col gap-4">
        <SettingsCellGroup>
          <SettingsCell cellName={<T id="networkEnabled" />} Component="div">
            <ToggleSwitch
              checked={!chain.disabled}
              disabled={!chain.disabled && shouldPreventDisablingChain}
              onChange={setChainEnabled}
              testID={ChainSettingsSelectors.networkEnabledSwitch}
              testIDProperties={props}
            />
          </SettingsCell>
        </SettingsCellGroup>

        <ManageUrlEntitiesView<StoredTezosNetwork | StoredEvmNetwork>
          activeI18nKey="activeRpc"
          activeItemId={chain.rpc.id}
          title={<T id="rpcEndpoints" />}
          items={chain.allRpcs}
          editModalTitleI18nKey="editSomeRpc"
          createModalTitle={t('addSomeRpc', chain.name)}
          confirmDeleteTitleI18nKey="confirmDeleteRpcTitle"
          confirmDeleteDescriptionI18nKey="confirmDeleteRpcDescription"
          urlInputPlaceholder="https://rpc.link"
          getIsEditable={isRpcEditable}
          getIsRemovable={isRpcRemovable}
          getEntityUrl={rpcUrlFn}
          setActiveItemId={setActiveRpcId}
          createEntity={addRpc}
          updateEntity={updateRpc}
          removeEntity={removeRpc}
          addButtonTestID={ChainSettingsSelectors.addRpcButton}
          itemTestID={ChainSettingsSelectors.rpcEndpointItem}
          activeSwitchTestID={ChainSettingsSelectors.activeRpcSwitch}
          activeCheckboxTestID={ChainSettingsSelectors.activeRpcCheckbox}
        />

        <ManageUrlEntitiesView<BlockExplorer>
          activeI18nKey="activeBlockExplorer"
          activeItemId={chain.activeBlockExplorer?.id ?? ''}
          title={<T id="blockExplorer" />}
          items={chain.allBlockExplorers}
          editModalTitleI18nKey="editSomeBlockExplorer"
          createModalTitle={t('addSomeBlockExplorer', chain.name)}
          confirmDeleteTitleI18nKey="confirmDeleteBlockExplorerTitle"
          confirmDeleteDescriptionI18nKey="confirmDeleteBlockExplorerDescription"
          urlInputPlaceholder="https://explorer.link"
          getIsEditable={isExplorerEditable}
          getIsRemovable={isExplorerRemovable}
          getEntityUrl={explorerUrlFn}
          setActiveItemId={setActiveExplorerId}
          createEntity={addExplorer}
          updateEntity={updateExplorer}
          removeEntity={removeBlockExplorer}
          addButtonTestID={ChainSettingsSelectors.addExplorerButton}
          itemTestID={ChainSettingsSelectors.blockExplorerItem}
          activeSwitchTestID={ChainSettingsSelectors.activeExplorerSwitch}
          activeCheckboxTestID={ChainSettingsSelectors.activeExplorerCheckbox}
        />
      </div>
    </PageLayout>
  );
});

export const ChainSettings = memo<ChainSettingsProps>(props => (
  <AdditionalChainsPropsContextProvider>
    <ChainSettingsBody {...props} />
  </AdditionalChainsPropsContextProvider>
));
