import React, { FC, SVGProps } from 'react';

import { Anchor } from 'app/atoms';
import { ReactComponent as TagIcon } from 'app/icons/tag.svg';
import { DAppIcon } from 'app/templates/DAppsList/DAppIcon';
import { CustomDAppInfo } from 'lib/apis/temple';

import { DAppStoreSelectors } from '../DAppsList.selectors';

type DAppItemProps = CustomDAppInfo;

const DAppItem: FC<DAppItemProps> = ({ dappUrl, name, logo, categories }) => (
  <div className="w-full mb-4 flex items-center">
    <Anchor
      className="mr-4"
      href={dappUrl}
      rel="noreferrer"
      testID={DAppStoreSelectors.DAppOpened}
      testIDProperties={{ dappUrl, name, promoted: false }}
      treatAsButton={true}
    >
      <DAppIcon name={name} logo={logo} />
    </Anchor>

    <div className="flex-1 flex justify-between items-start">
      <div className="text-gray-600 text-xs leading-tight">
        <p className="text-gray-900" style={{ fontSize: '0.8125rem' }}>
          {name}
        </p>

        <DAppCharacteristic Icon={TagIcon}>{categories.map(category => `#${category}`).join(', ')}</DAppCharacteristic>
      </div>
    </div>
  </div>
);

export default DAppItem;

type DAppCharacteristicProps = {
  Icon?: React.FC<SVGProps<SVGSVGElement>>;
  children: React.ReactChild | React.ReactChild[];
};

const DAppCharacteristic: FC<DAppCharacteristicProps> = ({ Icon, children }) => (
  <div className="leading-tight flex items-center mt-1">
    {Icon && <Icon className="h-3 w-auto mr-1 fill-current" />}
    {children}
  </div>
);
