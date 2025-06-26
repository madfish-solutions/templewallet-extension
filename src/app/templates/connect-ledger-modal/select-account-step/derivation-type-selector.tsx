import React, { memo, useCallback, useEffect, useRef, useState } from 'react';

import { DerivationType } from '@taquito/ledger-signer';

import { ActionListItem } from 'app/atoms/ActionListItem';
import { DropdownTriggerButton } from 'app/atoms/dropdown-trigger-button';
import DropdownWrapper from 'app/atoms/DropdownWrapper';
import Popper, { PopperRenderProps } from 'lib/ui/Popper';
import { combineRefs } from 'lib/ui/utils';

import { ConnectLedgerModalSelectors } from '../selectors';

interface DerivationTypeSelectorProps {
  derivationType: DerivationType;
  onSelect: SyncFn<DerivationType>;
}

const derivationTypesCharacteristics = {
  [DerivationType.ED25519]: {
    name: 'ED25519',
    accountPrefix: 'tz1'
  },
  [DerivationType.BIP32_ED25519]: {
    name: 'BIP32_ED25519',
    accountPrefix: 'tz1'
  },
  [DerivationType.SECP256K1]: {
    name: 'SECP256K1',
    accountPrefix: 'tz2'
  },
  [DerivationType.P256]: {
    name: 'P256',
    accountPrefix: 'tz3'
  }
};
const allDerivationTypes = [
  DerivationType.ED25519,
  DerivationType.BIP32_ED25519,
  DerivationType.SECP256K1,
  DerivationType.P256
];

export const DerivationTypeSelector = memo<DerivationTypeSelectorProps>(({ derivationType, onSelect }) => {
  const [width, setWidth] = useState<number | undefined>();
  const triggerButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!triggerButtonRef.current) return;

    const buttonElement = triggerButtonRef.current;
    const updateWidth = () => setWidth(buttonElement.getBoundingClientRect().width);

    updateWidth();
    buttonElement.addEventListener('resize', updateWidth);

    return () => buttonElement.removeEventListener('resize', updateWidth);
  }, []);

  return (
    <Popper
      placement="bottom-start"
      strategy="fixed"
      popup={props => (
        <DerivationTypesDropdown {...props} width={width} onSelect={onSelect} currentDerivationType={derivationType} />
      )}
    >
      {({ ref, toggleOpened }) => (
        <DropdownTriggerButton
          className="p-3"
          ref={combineRefs(ref, triggerButtonRef)}
          onClick={toggleOpened}
          testID={ConnectLedgerModalSelectors.derivationTypeDropdown}
        >
          <span className="text-font-medium-bold">{derivationTypesCharacteristics[derivationType].name}</span>
        </DropdownTriggerButton>
      )}
    </Popper>
  );
});

interface DerivationTypesDropdownProps extends PopperRenderProps {
  onSelect: SyncFn<DerivationType>;
  currentDerivationType: DerivationType;
  width?: number;
}

const DerivationTypesDropdown = memo<DerivationTypesDropdownProps>(
  ({ opened, currentDerivationType, width, toggleOpened, onSelect }) => {
    return (
      <DropdownWrapper opened={opened} design="day" className="p-2 flex flex-col mt-1" style={{ width }}>
        {allDerivationTypes.map(derivationType => (
          <DerivationTypeOption
            derivationType={Number(derivationType) as DerivationType}
            onSelect={onSelect}
            key={derivationType}
            toggleOpened={toggleOpened}
            active={Number(derivationType) === currentDerivationType}
          />
        ))}
      </DropdownWrapper>
    );
  }
);

interface DerivationTypeOptionProps {
  derivationType: DerivationType;
  onSelect: SyncFn<DerivationType>;
  active: boolean;
  toggleOpened: EmptyFn;
}

const DerivationTypeOption = memo<DerivationTypeOptionProps>(({ derivationType, active, toggleOpened, onSelect }) => {
  const handleClick = useCallback(() => {
    if (!active) {
      onSelect(derivationType);
      toggleOpened();
    }
  }, [active, derivationType, onSelect, toggleOpened]);
  const { name, accountPrefix } = derivationTypesCharacteristics[derivationType];

  return (
    <ActionListItem
      active={active}
      className="!px-2 !py-2.5"
      onClick={handleClick}
      testID={ConnectLedgerModalSelectors.derivationTypeOptionButton}
    >
      {name} ({accountPrefix}...)
    </ActionListItem>
  );
});
