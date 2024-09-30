import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { ToggleSwitch } from 'app/atoms';
import {
  ActionModal,
  ActionModalBodyContainer,
  ActionModalButton,
  ActionModalButtonsContainer
} from 'app/atoms/action-modal';
import { ActionsButtonsBox } from 'app/atoms/PageModal/actions-buttons-box';
import { SettingsCell } from 'app/atoms/SettingsCell';
import { SettingsCellGroup } from 'app/atoms/SettingsCellGroup';
import { StyledButton } from 'app/atoms/StyledButton';
import PageLayout from 'app/layouts/PageLayout';
import { T, t } from 'lib/i18n';
import { useBooleanState } from 'lib/ui/hooks';
import { HistoryAction, navigate } from 'lib/woozie';
import {
  OneOfChains,
  useAllEvmChains,
  useAllTezosChains,
  useEnabledEvmChains,
  useEnabledTezosChains
} from 'temple/front';
import { BlockExplorer } from 'temple/front/block-explorers';
import { isTestnetChain } from 'temple/front/chains';
import { StoredEvmNetwork, StoredTezosNetwork } from 'temple/networks';
import { TempleChainKind } from 'temple/types';

import { ManageUrlEntitiesView } from './manage-url-entities-view';
import { ChainSettingsSelectors } from './selectors';
import { useChainOperations } from './use-chain-operations';

interface ChainSettingsProps {
  chainKind: TempleChainKind;
  chainId: string;
}

interface ChainExistentSettingsProps {
  chain: OneOfChains;
  bottomEdgeIsVisible: boolean;
}

const rpcUrlFn = (item: { rpcBaseURL: string }) => item.rpcBaseURL;
const explorerUrlFn = (item: { url: string }) => item.url;

const ChainExistentSettings = memo<ChainExistentSettingsProps>(({ chain, bottomEdgeIsVisible }) => {
  const [removeChainModalIsOpen, openRemoveChainModal, closeRemoveChainModal] = useBooleanState(false);
  const enabledEvmChains = useEnabledEvmChains();
  const enabledTezChains = useEnabledTezosChains();
  const { kind: chainKind, chainId } = chain;
  const {
    setChainEnabled,
    addRpc,
    addExplorer,
    updateRpc,
    updateExplorer,
    removeRpc,
    removeBlockExplorer,
    removeChain
  } = useChainOperations(chainKind, chainId);
  const allEnabledChains = useMemo(
    () => (enabledEvmChains as OneOfChains[]).concat(enabledTezChains),
    [enabledEvmChains, enabledTezChains]
  );
  const enabledMainnetChains = useMemo(
    () => allEnabledChains.filter(chain => !isTestnetChain(chain)),
    [allEnabledChains]
  );
  const enabledTestnetChains = useMemo(() => allEnabledChains.filter(isTestnetChain), [allEnabledChains]);
  const shouldPreventDisablingChain =
    (isTestnetChain(chain) ? enabledTestnetChains : enabledMainnetChains).length === 1;

  const handleConfirmRemoveClick = useCallback(() => {
    closeRemoveChainModal();
    removeChain()
      .then(() => navigate('/settings/networks', HistoryAction.Replace))
      .catch(console.error);
  }, [closeRemoveChainModal, removeChain]);

  return (
    <>
      <div className="w-full h-full flex flex-col p-4 gap-4">
        <SettingsCellGroup>
          <SettingsCell cellName={<T id="networkEnabled" />} Component="div">
            <ToggleSwitch
              checked={!chain.disabled}
              disabled={!chain.disabled && shouldPreventDisablingChain}
              onChange={setChainEnabled}
              testID={ChainSettingsSelectors.networkEnabledSwitch}
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
          deleteLabelI18nKey="deleteRpc"
          successfullyAddedMessageI18nKey="rpcAdded"
          urlInputPlaceholder="https://rpc.link"
          getEntityUrl={rpcUrlFn}
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
          deleteLabelI18nKey="deleteBlockExplorer"
          confirmDeleteDescriptionI18nKey="confirmDeleteBlockExplorerDescription"
          successfullyAddedMessageI18nKey="blockExplorerAdded"
          urlInputPlaceholder="https://explorer.link"
          getEntityUrl={explorerUrlFn}
          createEntity={addExplorer}
          updateEntity={updateExplorer}
          removeEntity={removeBlockExplorer}
          addButtonTestID={ChainSettingsSelectors.addExplorerButton}
          itemTestID={ChainSettingsSelectors.blockExplorerItem}
          activeSwitchTestID={ChainSettingsSelectors.activeExplorerSwitch}
          activeCheckboxTestID={ChainSettingsSelectors.activeExplorerCheckbox}
        />
      </div>
      {!chain.default && (
        <ActionsButtonsBox className="sticky left-0 bottom-0" shouldCastShadow={!bottomEdgeIsVisible}>
          <StyledButton
            size="L"
            color="red-low"
            onClick={openRemoveChainModal}
            testID={ChainSettingsSelectors.removeNetworkButton}
          >
            <T id="removeNetwork" />
          </StyledButton>
        </ActionsButtonsBox>
      )}
      {removeChainModalIsOpen && (
        <ActionModal title={t('removeNetworkModalTitle', chain.name)} hasCloseButton={false}>
          <ActionModalBodyContainer>
            <p className="text-center text-grey-1 text-font-description">
              <T id="removeNetworkModalDescription" />
            </p>
          </ActionModalBodyContainer>
          <ActionModalButtonsContainer>
            <ActionModalButton
              color="red-low"
              onClick={closeRemoveChainModal}
              testID={ChainSettingsSelectors.cancelRemoveNetworkButton}
            >
              <T id="cancel" />
            </ActionModalButton>

            <ActionModalButton
              color="red"
              onClick={handleConfirmRemoveClick}
              testID={ChainSettingsSelectors.confirmRemoveNetworkButton}
            >
              <T id="remove" />
            </ActionModalButton>
          </ActionModalButtonsContainer>
        </ActionModal>
      )}
    </>
  );
});

export const ChainSettings = memo<ChainSettingsProps>(props => {
  const [bottomEdgeIsVisible, setBottomEdgeIsVisible] = useState(true);
  const { chainId, chainKind } = props;
  const evmChains = useAllEvmChains();
  const tezChains = useAllTezosChains();
  // `chain` may become `undefined` when the chain is being removed
  const chain: OneOfChains | undefined = chainKind === TempleChainKind.Tezos ? tezChains[chainId] : evmChains[chainId];

  const [pageTitle, setPageTitle] = useState(() => (chain?.nameI18nKey ? <T id={chain.nameI18nKey} /> : chain?.name));
  useEffect(() => {
    if (chain) {
      setPageTitle(chain.nameI18nKey ? <T id={chain.nameI18nKey} /> : chain.name);
    }
  }, [chain]);

  return (
    <PageLayout
      contentPadding={false}
      pageTitle={pageTitle}
      onBottomEdgeVisibilityChange={setBottomEdgeIsVisible}
      bottomEdgeThreshold={16}
    >
      {chain ? <ChainExistentSettings chain={chain} bottomEdgeIsVisible={bottomEdgeIsVisible} /> : null}
    </PageLayout>
  );
});
