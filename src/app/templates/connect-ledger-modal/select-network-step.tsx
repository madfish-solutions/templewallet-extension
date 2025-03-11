import React, { ReactNode, memo, useCallback } from 'react';

import { Button } from 'app/atoms';
import { SettingsCellSingle } from 'app/atoms/SettingsCell';
import { SettingsCellGroup } from 'app/atoms/SettingsCellGroup';
import { t } from 'lib/i18n';
import { TempleChainKind } from 'temple/types';

import { ChainKindLabel } from '../chain-kind-label';

import { ConnectLedgerModalSelectors } from './selectors';

interface SelectNetworkStepProps {
  onSelect: SyncFn<TempleChainKind>;
}

export const SelectNetworkStep = memo<SelectNetworkStepProps>(({ onSelect }) => (
  <div className="flex flex-col gap-1 p-4">
    <span className="text-font-description-bold m-1">{t('selectNetwork')}</span>
    <div className="flex flex-col gap-3">
      <NetworkOption chainKind={TempleChainKind.EVM} tooltipText={t('evmLedgerTooltip')} onSelect={onSelect} />

      <NetworkOption chainKind={TempleChainKind.Tezos} tooltipText={t('tezosLedgerTooltip')} onSelect={onSelect} />
    </div>
  </div>
));

interface NetworkOptionProps {
  chainKind: TempleChainKind;
  tooltipText: ReactNode;
  onSelect: SyncFn<TempleChainKind>;
}

const NetworkOption = memo<NetworkOptionProps>(({ chainKind, tooltipText, onSelect }) => {
  const handleClick = useCallback(() => onSelect(chainKind), [chainKind, onSelect]);

  return (
    <SettingsCellGroup>
      <SettingsCellSingle
        isLast
        cellName={<ChainKindLabel chainKind={chainKind} tooltipText={tooltipText} />}
        Component={Button}
        testID={ConnectLedgerModalSelectors.selectNetworkButton}
        testIDProperties={{ chainKind: TempleChainKind.EVM }}
        onClick={handleClick}
      />
    </SettingsCellGroup>
  );
});
