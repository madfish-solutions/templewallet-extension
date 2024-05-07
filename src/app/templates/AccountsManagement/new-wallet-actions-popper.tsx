import React, { FC, memo } from 'react';

import { Button } from 'app/atoms';
import { ReactComponent as AddIcon } from 'app/icons/add.svg';
import { ReactComponent as DownloadIcon } from 'app/icons/download.svg';
import { ReactComponent as EyeIcon } from 'app/icons/eye.svg';
import { ReactComponent as LinkIcon } from 'app/icons/link.svg';
import { ReactComponent as PlusIcon } from 'app/icons/plus.svg';
import Popper, { PopperRenderProps } from 'lib/ui/Popper';
import { navigate } from 'lib/woozie';

import { Action, ActionsDropdown } from './actions-dropdown';

const actionsDropdownStyle = { transform: 'translate(2rem, 1.75rem)' };

const actions: Action[] = [
  {
    key: 'create-wallet',
    danger: false,
    i18nKey: 'createWallet' as const,
    icon: AddIcon,
    onClick: () => navigate('/create-another-wallet')
  },
  {
    key: 'import-wallet',
    danger: false,
    i18nKey: 'importWallet' as const,
    icon: DownloadIcon,
    onClick: () => navigate('/import-account/wallet-from-mnemonic')
  },
  {
    key: 'ledger-connect',
    danger: false,
    i18nKey: 'connectLedger' as const,
    icon: LinkIcon,
    onClick: () => navigate('/connect-ledger')
  },
  {
    key: 'watch-only',
    danger: false,
    i18nKey: 'watchOnlyAccount' as const,
    icon: EyeIcon,
    onClick: () => navigate('/import-account/watch-only')
  }
];

const NewWalletActionsDropdown = memo<PopperRenderProps>(({ opened, setOpened, toggleOpened }) => (
  <ActionsDropdown
    opened={opened}
    setOpened={setOpened}
    toggleOpened={toggleOpened}
    title="Add New Wallet"
    actions={actions}
    style={actionsDropdownStyle}
  />
));

export const NewWalletActionsPopper: FC = () => (
  <Popper
    placement="left-start"
    strategy="fixed"
    style={{ pointerEvents: 'none' }}
    popup={props => <NewWalletActionsDropdown {...props} />}
  >
    {({ ref, toggleOpened }) => (
      <Button
        ref={ref}
        className="min-w-8 h-8 rounded-md flex justify-center items-center bg-blue-200 text-blue-500"
        onClick={toggleOpened}
      >
        <PlusIcon className="w-4 h-4 stroke-2 stroke-current" />
      </Button>
    )}
  </Popper>
);
