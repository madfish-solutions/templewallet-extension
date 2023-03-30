import React, { FC, useMemo } from 'react';

import classNames from 'clsx';

import { Button } from 'app/atoms/Button';
import { ReactComponent as AlertIcon } from 'app/icons/alert-sm.svg';
import { T } from 'lib/i18n';
import { navigate } from 'lib/woozie';

import ABContainer from '../../../../../../atoms/ABContainer';
import modStyles from '../../Tokens.module.css';

export const DelegateTezosTag: FC = () => {
  const handleTagClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    navigate('/explore/tez/?tab=delegation');
  };

  const buttonA = useMemo(
    () => (
      <Button
        onClick={handleTagClick}
        className={classNames('inline-flex items-center pl-1 ml-2 py-1 pr-1.5', modStyles['apyTag'])}
      >
        <AlertIcon className="mr-1 stroke-current" />
        <T id="delegate" />
      </Button>
    ),
    []
  );

  const buttonB = useMemo(
    () => (
      <Button onClick={handleTagClick} className={classNames('uppercase ml-2 px-1.5 py-1', modStyles['apyTag'])}>
        <T id="notDelegated" />
      </Button>
    ),
    []
  );

  return <ABContainer groupAComponent={buttonA} groupBComponent={buttonB} />;
};
