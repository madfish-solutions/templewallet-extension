import React, { FC } from 'react';

import classNames from 'clsx';

import { Button } from 'app/atoms/Button';
import Identicon from 'app/atoms/Identicon';
import Logo from 'app/atoms/Logo';
import Name from 'app/atoms/Name';
import { useAppEnv } from 'app/env';
import ContentContainer from 'app/layouts/ContentContainer';
import { useTempleClient, useAccount } from 'lib/temple/front';
import Popper from 'lib/ui/Popper';
import { Link } from 'lib/woozie';

import AccountDropdown from './Header/AccountDropdown';
import NetworkSelect from './Header/NetworkSelect';
import styles from './Header.module.css';
import { HeaderSelectors } from './Header.selectors';

const Header: FC = () => {
  const appEnv = useAppEnv();
  const { ready } = useTempleClient();

  return (
    <header className={classNames('bg-primary-orange', styles['inner-shadow'], appEnv.fullPage && 'pb-20 -mb-20')}>
      <ContentContainer className="py-4">
        <div className={classNames(appEnv.fullPage && 'px-4')}>
          <div className="flex items-stretch">
            <Link to="/" className="flex-shrink-0 pr-4" testID={HeaderSelectors.templeLogoIcon}>
              <div className="flex items-center">
                <Logo hasTitle={appEnv.fullPage} fill="#FFFFFF" />
              </div>
            </Link>

            {ready && <Control />}
          </div>
        </div>
      </ContentContainer>
    </header>
  );
};

export default Header;

const Control: FC = () => {
  const account = useAccount();

  return (
    <>
      <div className="flex-1 flex flex-col items-end">
        <div className="max-w-full overflow-x-hidden">
          <Name className="text-primary-white text-sm font-semibold text-shadow-black opacity-90">{account.name}</Name>
        </div>

        <div className="flex-1" />

        <NetworkSelect />
      </div>

      <Popper placement="bottom-end" strategy="fixed" popup={props => <AccountDropdown {...props} />}>
        {({ ref, opened, toggleOpened }) => (
          <Button
            ref={ref}
            className={classNames(
              'ml-2 flex-shrink-0 flex p-px',
              'rounded-md border border-white border-opacity-25',
              'bg-white bg-opacity-10 cursor-pointer',
              'transition ease-in-out duration-200',
              opened
                ? 'shadow-md opacity-100'
                : 'shadow hover:shadow-md focus:shadow-md opacity-90 hover:opacity-100 focus:opacity-100'
            )}
            onClick={toggleOpened}
            testID={HeaderSelectors.accountIcon}
          >
            <Identicon type="bottts" hash={account.publicKeyHash} size={48} />
          </Button>
        )}
      </Popper>
    </>
  );
};
