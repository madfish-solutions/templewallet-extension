import React, { ComponentProps, FC } from 'react';

import classNames from 'clsx';

import Logo from 'app/atoms/Logo';
import { useABTestingLoading } from 'app/hooks/use-ab-testing-loading';
import { ReactComponent as EntranceIcon } from 'app/icons/entrance.svg';
import { ReactComponent as FolderAddIcon } from 'app/icons/folder-add.svg';
import { ReactComponent as LedgerNanoIcon } from 'app/misc/ledger.svg';
import { TestIDProps } from 'lib/analytics';
import { TID, T } from 'lib/i18n';
import { Link } from 'lib/woozie';

import { WelcomeSelectors } from './Welcome.selectors';

interface TSign extends TestIDProps {
  key: string;
  linkTo: string;
  filled: boolean;
  Icon: ImportedSVGComponent;
  titleI18nKey: TID;
  descriptionI18nKey: TID;
}

const SIGNS: TSign[] = [
  {
    key: 'import',
    linkTo: '/import-wallet',
    filled: false,
    Icon: ({ className, ...rest }: ComponentProps<typeof EntranceIcon>) => (
      <EntranceIcon className={classNames('transform rotate-90', className)} {...rest} />
    ),
    titleI18nKey: 'importExistingWallet',
    descriptionI18nKey: 'importExistingWalletDescription',
    testID: WelcomeSelectors.importExistingWallet
  },
  {
    key: 'create',
    linkTo: '/create-wallet',
    filled: true,
    Icon: FolderAddIcon,
    titleI18nKey: 'createNewWallet',
    descriptionI18nKey: 'createNewWalletDescription',
    testID: WelcomeSelectors.createNewWallet
  }
];

const Welcome: FC = () => {
  useABTestingLoading();

  return (
    <div
      className={classNames(
        'w-full max-w-screen-md mx-auto',
        'min-h-screen flex flex-col items-center justify-center',
        'px-4 pt-4 pb-36'
      )}
    >
      <div className="mb-6 text-2xl text-gray-600 font-light">
        <T id="welcomeTo" />
      </div>

      <Logo hasTitle style={{ height: 70 }} />

      <div className={classNames('w-full mt-8 mb-4 flex items-stretch')}>
        {SIGNS.map(({ key, linkTo, filled, Icon, titleI18nKey, descriptionI18nKey, testID }) => (
          <div key={key} className={classNames('w-1/2', 'p-4')}>
            <Link
              to={linkTo}
              className={classNames(
                'relative block',
                'w-full pb-2/3',
                'bg-primary-orange',
                'overflow-hidden rounded-lg',
                'transition duration-300 ease-in-out',
                'transform hover:scale-110 focus:scale-110',
                'shadow-md hover:shadow-lg focus:shadow-lg'
              )}
              testID={testID}
            >
              <div className="absolute inset-0 p-1">
                <div
                  className={classNames(
                    'w-full h-full py-4 px-6',
                    'overflow-hidden rounded-md',
                    'flex flex-col justify-center',
                    filled ? 'text-white' : 'shadow-inner bg-primary-orange-lighter text-primary-orange',
                    'text-shadow-black-orange'
                  )}
                >
                  <Icon className="self-center transform scale-125 stroke-current" />

                  <h1 className="text-xl font-semibold text-center">
                    <T id={titleI18nKey} />
                  </h1>

                  <p
                    className={classNames(
                      'mt-2 text-center text-xs',
                      filled ? 'text-primary-orange-lighter' : 'text-primary-orange'
                    )}
                  >
                    <T id={descriptionI18nKey} />
                  </p>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      <div className="mt-12 mb-4 text-base text-gray-600 font-light">
        <p className="mb-2 text-lg">Create the Temple wallet account and you may:</p>

        <p className="mb-1 flex items-center">
          <span className="text-lg pr-2">•</span>work with your{' '}
          <LedgerNanoIcon className="ml-2 mr-1" style={{ width: 'auto', height: '0.5rem' }} /> Ledger device
        </p>
        <p className="mb-1 flex items-center">
          <span className="text-lg pr-2">•</span>send and receive any Tezos based tokens
        </p>
        <p className="mb-1 flex items-center">
          <span className="text-lg pr-2">•</span>connect and interact with Tezos dApps
        </p>
      </div>
    </div>
  );
};

export default Welcome;
