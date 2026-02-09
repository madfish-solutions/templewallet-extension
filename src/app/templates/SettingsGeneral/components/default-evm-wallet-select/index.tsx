import React, { memo, useCallback, useMemo } from 'react';

import { CellPartProps, SelectWithModal } from 'app/templates/select-with-modal';
import { t } from 'lib/i18n';
import { useTempleClient } from 'lib/temple/front';
import { EvmDefaultWallet } from 'lib/temple/types';

import { SettingsGeneralSelectors } from '../../selectors';

interface EvmDefaultWalletOption {
  value: EvmDefaultWallet;
  label: string;
  description: string;
}

const optionKeyFn = ({ value }: EvmDefaultWalletOption) => value;

const CellName = ({ option: { label } }: CellPartProps<EvmDefaultWalletOption>) => (
  <span className="text-font-medium-bold">{label}</span>
);

const ModalCellName = ({ option: { label, description } }: CellPartProps<EvmDefaultWalletOption>) => (
  <div className="flex flex-col gap-1">
    <span className="text-font-medium-bold">{label}</span>
    <span className="text-font-small font-normal text-grey-1">{description}</span>
  </div>
);

export const DefaultEvmWalletSelect = memo(() => {
  const { settings, updateSettings } = useTempleClient();

  const options = useMemo<EvmDefaultWalletOption[]>(
    () => [
      {
        value: EvmDefaultWallet.AlwaysAsk,
        label: t('evmDefaultWalletAlwaysAsk'),
        description: t('evmDefaultWalletAlwaysAskDescription')
      },
      {
        value: EvmDefaultWallet.Other,
        label: t('evmDefaultWalletOther'),
        description: t('evmDefaultWalletOtherDescription')
      }
    ],
    []
  );

  const selectedValue = settings?.evmDefaultWallet ?? EvmDefaultWallet.AlwaysAsk;
  const value = useMemo(
    () => options.find(option => option.value === selectedValue) ?? options[0],
    [options, selectedValue]
  );

  const handleSelect = useCallback(
    (option: EvmDefaultWalletOption) => updateSettings({ evmDefaultWallet: option.value }),
    [updateSettings]
  );

  return (
    <SelectWithModal
      title={t('defaultEvmWallet')}
      options={options}
      value={value}
      searchKeys={[]}
      keyFn={optionKeyFn}
      CellName={CellName}
      ModalCellName={ModalCellName}
      onSelect={handleSelect}
      testID={SettingsGeneralSelectors.evmDefaultWalletDropDown}
      itemTestID={SettingsGeneralSelectors.evmDefaultWalletItem}
    />
  );
});
