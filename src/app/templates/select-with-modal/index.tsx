import React, { useCallback } from 'react';

import { Button, IconBase } from 'app/atoms';
import { SettingsCellSingle } from 'app/atoms/SettingsCell';
import { SettingsCellGroup } from 'app/atoms/SettingsCellGroup';
import { ReactComponent as CompactDownIcon } from 'app/icons/base/compact_down.svg';
import { InputContainer } from 'app/templates/InputContainer/InputContainer';
import { useBooleanState } from 'lib/ui/hooks';

import { SelectModal, SelectModalProps } from './select-modal';

export const NullComponent = () => null;

interface SelectWithModalProps<T, P extends null | ((item: T) => any)>
  extends Omit<SelectModalProps<T, P>, 'opened' | 'onRequestClose' | 'CellIcon'> {
  CellIcon?: SelectModalProps<T, P>['CellIcon'];
  ModalCellIcon?: SelectModalProps<T, P>['CellIcon'];
  testID: string;
  className?: string;
}

export type { CellPartProps } from './select-modal-option';

export const SelectWithModal = <T, P extends null | ((item: T) => any)>({
  title,
  testID,
  CellIcon = NullComponent,
  ModalCellIcon = CellIcon,
  CellName,
  value,
  className,
  onSelect,
  ...restProps
}: SelectWithModalProps<T, P>) => {
  const [selectModalOpened, openSelectModal, closeSelectModal] = useBooleanState(false);

  const handleSelect = useCallback(
    (item: T) => {
      onSelect(item);
      closeSelectModal();
    },
    [closeSelectModal, onSelect]
  );

  return (
    <>
      <InputContainer className={className} header={<span className="m-1 text-font-description-bold">{title}</span>}>
        <SettingsCellGroup>
          <SettingsCellSingle
            Component={Button}
            cellIcon={<CellIcon option={value} />}
            cellName={<CellName option={value} />}
            testID={testID}
            onClick={openSelectModal}
          >
            <IconBase size={16} className="text-primary" Icon={CompactDownIcon} />
          </SettingsCellSingle>
        </SettingsCellGroup>
      </InputContainer>

      <SelectModal<T, P>
        {...restProps}
        title={title}
        opened={selectModalOpened}
        value={value}
        CellIcon={ModalCellIcon}
        CellName={CellName}
        onRequestClose={closeSelectModal}
        onSelect={handleSelect}
      />
    </>
  );
};
