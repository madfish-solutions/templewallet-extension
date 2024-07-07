import React, { FC, memo } from 'react';

import { ActionListItem } from 'app/atoms/ActionListItem';
import { ActionsDropdownPopup } from 'app/atoms/ActionsDropdown';
import { StayActiveIconButton } from 'app/atoms/IconButton';
import { ReactComponent as AddAccIcon } from 'app/icons/base/add_acc.svg';
import { ReactComponent as ImportedIcon } from 'app/icons/base/imported.svg';
import { ReactComponent as LedgerIcon } from 'app/icons/base/ledger2.svg';
import { ReactComponent as PlusIcon } from 'app/icons/base/plus.svg';
import { ReactComponent as WatchIcon } from 'app/icons/base/watch.svg';
import { T } from 'lib/i18n';
import Popper, { PopperRenderProps } from 'lib/ui/Popper';

const NewWalletActionsDropdown = memo<PopperRenderProps>(({ opened }) => (
  <ActionsDropdownPopup title="Add New Wallet" opened={opened} style={{ minWidth: 154 }}>
    <ActionListItem Icon={AddAccIcon} linkTo="/create-another-wallet">
      Create wallet
    </ActionListItem>

    <ActionListItem Icon={ImportedIcon} linkTo="/import-account/wallet-from-mnemonic">
      Import wallet
    </ActionListItem>

    <ActionListItem Icon={LedgerIcon} linkTo="/connect-ledger">
      Ledger connect
    </ActionListItem>

    <ActionListItem Icon={WatchIcon} linkTo="/import-account/watch-only">
      <T id="watchOnlyAccount" />
    </ActionListItem>
  </ActionsDropdownPopup>
));

export const NewWalletActionsPopper: FC = () => (
  <Popper placement="bottom-end" strategy="fixed" popup={props => <NewWalletActionsDropdown {...props} />}>
    {({ ref, opened, toggleOpened }) => (
      <StayActiveIconButton Icon={PlusIcon} color="blue" ref={ref} active={opened} onClick={toggleOpened} />
    )}
  </Popper>
);
