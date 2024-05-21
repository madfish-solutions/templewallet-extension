import React, { FC, memo } from 'react';

import { ActionListItem } from 'app/atoms/ActionListItem';
import { ActionsDropdownPopup } from 'app/atoms/ActionsDropdown';
import { IconButton } from 'app/atoms/IconButton';
import { ReactComponent as AddAccIcon } from 'app/icons/base/add_acc.svg';
import { ReactComponent as ImportedIcon } from 'app/icons/base/imported.svg';
import { ReactComponent as LedgerIcon } from 'app/icons/base/ledger2.svg';
import { ReactComponent as PlusIcon } from 'app/icons/base/plus.svg';
import { ReactComponent as WatchIcon } from 'app/icons/base/watch.svg';
import { T } from 'lib/i18n';
import Popper, { PopperRenderProps } from 'lib/ui/Popper';

interface NewWalletActionsPopperProps {
  startWalletCreation: () => void;
}

const NewWalletActionsDropdown = memo<PopperRenderProps & NewWalletActionsPopperProps>(
  ({ opened, setOpened, startWalletCreation }) => (
    <ActionsDropdownPopup title="Add New Wallet" opened={opened} style={{ minWidth: 154 }}>
      <ActionListItem Icon={AddAccIcon} onClick={startWalletCreation} setOpened={setOpened}>
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
  )
);

export const NewWalletActionsPopper: FC<NewWalletActionsPopperProps> = props => (
  <Popper
    placement="bottom-end"
    strategy="fixed"
    popup={popperProps => <NewWalletActionsDropdown {...popperProps} {...props} />}
  >
    {({ ref, opened, toggleOpened }) => (
      <IconButton Icon={PlusIcon} color="blue" ref={ref} active={opened} onClick={toggleOpened} />
    )}
  </Popper>
);
