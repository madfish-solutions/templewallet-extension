import { FC } from 'react';

import clsx from 'clsx';

import { ReactComponent as PlusIcon } from 'app/icons/base/plus.svg';
import { ReactComponent as PlusCircleIcon } from 'app/icons/base/plus_circle.svg';
import { T } from 'lib/i18n';

import { Button } from './Button';
import { IconBase } from './IconBase';

interface Props {
  manageActive: boolean;
  className?: string;
  onClick: EmptyFn;
}

export const AddCustomTokenButton: FC<Props> = ({ manageActive, className, onClick }) => {
  const Component = manageActive ? Manage : Default;

  return <Component onClick={onClick} className={className} />;
};

interface CommonProps {
  onClick: EmptyFn;
  className?: string;
}

const Manage: FC<CommonProps> = ({ onClick, className }) => (
  <Button
    className={clsx(
      'flex justify-between items-center p-3 rounded-8 border-0.5 bg-white border-lines hover:bg-grey-4',
      className
    )}
    onClick={onClick}
  >
    <span className="text-font-medium-bold">
      <T id="addTokenNonCapitalize" />
    </span>
    <IconBase Icon={PlusIcon} size={24} className="text-secondary" />
  </Button>
);

const Default: FC<CommonProps> = ({ onClick, className }) => (
  <Button
    className={clsx(
      'w-fit flex flex-row mb-8 px-2 py-1 bg-secondary-low rounded-md text-font-description-bold text-secondary',
      className
    )}
    onClick={onClick}
  >
    <IconBase Icon={PlusCircleIcon} size={12} className="stroke-current" />
    <T id="addTokenNonCapitalize" />
  </Button>
);
