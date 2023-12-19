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
        'min-h-screen',
        'w-full max-w-screen-md mx-auto',
        'px-4',
        'flex flex-col items-center justify-center'
      )}
    >
      <div className={classNames('-mt-32 mb-6', 'text-2xl text-gray-600 font-light')}>
        <T id="welcomeTo" />
      </div>

      <div className="flex items-center mb-8">
        <Logo hasTitle style={{ height: 70 }} />
      </div>

      <div className={classNames('w-full', 'my-4', 'flex items-stretch')}>
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
              <div className={classNames('absolute inset-0', 'p-1')}>
                <div
                  className={classNames(
                    'w-full h-full',
                    'overflow-hidden rounded-md',
                    'px-10 py-4',
                    'flex flex-col',
                    filled ? 'text-white' : 'shadow-inner bg-primary-orange-lighter text-primary-orange',
                    'text-shadow-black-orange'
                  )}
                >
                  <div className={classNames('flex-1', 'flex flex-col items-center justify-end')}>
                    <Icon className="transform scale-125 stroke-current" />
                  </div>

                  <T id={titleI18nKey}>
                    {message => <h1 className="pb-1 text-xl font-semibold text-center">{message}</h1>}
                  </T>

                  <div className="flex-1">
                    <T id={descriptionI18nKey}>
                      {message => (
                        <p
                          className={classNames(
                            'my-1 text-center',
                            'text-xs',
                            filled ? 'text-primary-orange-lighter' : 'text-primary-orange'
                          )}
                        >
                          {message}
                        </p>
                      )}
                    </T>
                  </div>
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
