import React from 'react';

import classNames from 'clsx';

import { Button } from 'app/atoms/Button';
import { TID, T } from 'lib/i18n';
import { Link } from 'lib/woozie';

export interface ActionButtonProps {
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
  i18nKey: TID;
  linkTo: string | null;
  onClick: () => void;
  testID: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({ Icon, linkTo, onClick, i18nKey, testID }) => {
  const baseProps = {
    testID,
    className: classNames(
      'block w-full flex items-center px-2 whitespace-nowrap overflow-hidden',
      'rounded text-white text-shadow-black text-sm',
      'hover:bg-white hover:bg-opacity-10',
      'transition ease-in-out duration-200'
    ),
    style: {
      paddingTop: '0.375rem',
      paddingBottom: '0.375rem'
    },
    onClick,
    children: (
      <>
        <div className="flex items-center w-8">
          <Icon className="w-auto h-6 stroke-current" />
        </div>

        <T id={i18nKey} />
      </>
    )
  };

  return linkTo ? <Link {...baseProps} to={linkTo} /> : <Button {...baseProps} />;
};
