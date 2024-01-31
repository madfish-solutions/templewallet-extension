import React, { memo, useCallback, useEffect, useState } from 'react';

import clsx from 'clsx';
import { throttle } from 'lodash';

import { ReactComponent as ArrowUpIcon } from 'app/icons/arrow-up.svg';

import { Button } from './Button';

export const ScrollBackUpButton = memo(() => {
  const [shown, setShown] = useState(() => document.documentElement.scrollTop > getScrollThreshold());

  useEffect(() => {
    const listener = throttle(() => void setShown(document.documentElement.scrollTop > getScrollThreshold()), 100, {
      leading: false,
      trailing: true
    });

    document.addEventListener('scroll', listener);

    return () => document.removeEventListener('scroll', listener);
  }, []);

  const onClick = useCallback(() => void document.documentElement.scrollIntoView({ behavior: 'smooth' }), []);

  return (
    <Button
      className={clsx(
        'sticky bottom-6',
        'mt-5 mx-auto flex items-center text-gray-600 py-1 px-2 text-sm leading-5 select-none',
        'bg-white hover:bg-gray-200 rounded shadow-lg',
        'transition ease-in-out duration-100',
        shown ? 'cursor-pointer' : 'opacity-0 pointer-events-none'
      )}
      onClick={onClick}
      testID="SCROLL_BACK_UP"
    >
      <ArrowUpIcon className="w-4 h-4 mr-0.5 text-gray-600 stroke-current" />

      <span>Back to Top</span>
    </Button>
  );
});

/** (i) `4300px` is approximately 30 rows of NFTs in our grid + top headers */
const getScrollThreshold = () => Math.min(4300, 3 * window.innerHeight);
