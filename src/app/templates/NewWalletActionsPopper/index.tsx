import React, { FC, memo } from 'react';

import { ActionListItem } from 'app/atoms/ActionListItem';
import { ActionsDropdownPopup } from 'app/atoms/ActionsDropdown';
import { IconButton } from 'app/atoms/IconButton';
import { ReactComponent as AddAccIcon } from 'app/icons/base/add_acc.svg';
import { ReactComponent as ImportedIcon } from 'app/icons/base/imported.svg';
import { ReactComponent as LedgerIcon } from 'app/icons/base/ledger2.svg';
import { ReactComponent as PlusIcon } from 'app/icons/base/plus.svg';
import { ReactComponent as WatchIcon } from 'app/icons/base/watch.svg';
import { TestIDProps } from 'lib/analytics';
import { T } from 'lib/i18n';
import Popper, { PopperRenderProps } from 'lib/ui/Popper';

import { NewWalletActionsPopperSelectors } from './selectors';

interface NewWalletActionsPopperProps extends TestIDProps {
  startWalletCreation: EmptyFn;
}

const NewWalletActionsDropdown = memo<PopperRenderProps & NewWalletActionsPopperProps>(
  ({ opened, setOpened, startWalletCreation }) => (
    <ActionsDropdownPopup title="Add New Wallet" opened={opened} style={{ minWidth: 154 }}>
      <ActionListItem
        Icon={AddAccIcon}
        onClick={startWalletCreation}
        setOpened={setOpened}
        testID={NewWalletActionsPopperSelectors.createWallet}
      >
        <T id="createWallet" />
      </ActionListItem>

      <ActionListItem
        Icon={ImportedIcon}
        linkTo="/import-account/wallet-from-mnemonic"
        testID={NewWalletActionsPopperSelectors.importWallet}
      >
        <T id="importWallet" />
      </ActionListItem>

      <ActionListItem Icon={LedgerIcon} linkTo="/connect-ledger" testID={NewWalletActionsPopperSelectors.ledgerConnect}>
        <T id="ledgerConnect" />
      </ActionListItem>

      <ActionListItem
        Icon={WatchIcon}
        linkTo="/import-account/watch-only"
        testID={NewWalletActionsPopperSelectors.watchOnlyAccount}
      >
        <T id="watchOnlyAccount" />
      </ActionListItem>
    </ActionsDropdownPopup>
  )
);

export const NewWalletActionsPopper: FC<NewWalletActionsPopperProps> = ({ startWalletCreation, ...testIDProps }) => (
  <Popper
    placement="bottom-end"
    strategy="fixed"
    popup={popperProps => <NewWalletActionsDropdown {...popperProps} startWalletCreation={startWalletCreation} />}
  >
    {({ ref, opened, toggleOpened }) => (
      <IconButton Icon={PlusIcon} color="blue" ref={ref} active={opened} onClick={toggleOpened} {...testIDProps} />
    )}
  </Popper>
);
