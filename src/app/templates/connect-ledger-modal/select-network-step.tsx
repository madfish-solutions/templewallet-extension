import React, { ReactNode, memo, useCallback, useState } from 'react';

import clsx from 'clsx';

import { FadeTransition } from 'app/a11y/FadeTransition';
import { Button } from 'app/atoms';
import { SettingsCellSingle } from 'app/atoms/SettingsCell';
import { SettingsCellGroup } from 'app/atoms/SettingsCellGroup';
import { StyledButton } from 'app/atoms/StyledButton';
import { T, t } from 'lib/i18n';
import { TempleChainKind } from 'temple/types';

import { ChainKindLabel } from '../chain-kind-label';
import { PageModalScrollViewWithActions } from '../page-modal-scroll-view-with-actions';

import { ConnectLedgerModalSelectors } from './selectors';

interface SelectNetworkStepProps {
  onSelect: SyncFn<TempleChainKind>;
  selectedChainKind?: TempleChainKind;
}

export const SelectNetworkStep = memo<SelectNetworkStepProps>(({ onSelect, selectedChainKind }) => {
  const [selectedNetwork, setSelectedNetwork] = useState<TempleChainKind>(selectedChainKind ?? TempleChainKind.EVM);

  const handleContinue = useCallback(() => {
    onSelect(selectedNetwork);
  }, [onSelect, selectedNetwork]);

  return (
    <FadeTransition>
      <PageModalScrollViewWithActions
        className="!px-0"
        actionsBoxProps={{
          shouldChangeBottomShift: false,
          children: (
            <StyledButton
              size="L"
              className="w-full"
              color="primary"
              onClick={handleContinue}
              testID={ConnectLedgerModalSelectors.continueButton}
            >
              <T id="continue" />
            </StyledButton>
          )
        }}
      >
        <div className="flex flex-col gap-1 p-4">
          <span className="text-font-description-bold m-1">{t('selectNetwork')}</span>
          <div className="flex flex-col gap-3">
            <NetworkOption
              chainKind={TempleChainKind.EVM}
              tooltipText={t('evmLedgerTooltip')}
              selected={selectedNetwork === TempleChainKind.EVM}
              onSelectClick={setSelectedNetwork}
            />

            <NetworkOption
              chainKind={TempleChainKind.Tezos}
              tooltipText={t('tezosLedgerTooltip')}
              selected={selectedNetwork === TempleChainKind.Tezos}
              onSelectClick={setSelectedNetwork}
            />
          </div>
        </div>
      </PageModalScrollViewWithActions>
    </FadeTransition>
  );
});

interface NetworkOptionProps {
  chainKind: TempleChainKind;
  tooltipText: ReactNode;
  selected: boolean;
  onSelectClick: SyncFn<TempleChainKind>;
}

const NetworkOption = memo<NetworkOptionProps>(({ chainKind, tooltipText, selected, onSelectClick }) => {
  const handleClick = useCallback(() => onSelectClick(chainKind), [chainKind, onSelectClick]);

  return (
    <SettingsCellGroup className={clsx('transition-all', selected && '!border-1 !border-primary')}>
      <SettingsCellSingle
        isLast
        cellName={<ChainKindLabel chainKind={chainKind} tooltipText={tooltipText} />}
        Component={Button}
        testID={ConnectLedgerModalSelectors.selectNetworkButton}
        testIDProperties={{ chainKind }}
        onClick={handleClick}
      />
    </SettingsCellGroup>
  );
});
