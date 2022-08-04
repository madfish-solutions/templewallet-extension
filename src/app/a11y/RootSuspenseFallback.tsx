import React, { FC, useEffect } from 'react';

import useForceUpdate from 'use-force-update';

import Spinner from 'app/atoms/Spinner/Spinner';

const DELAY = 1_000;

let startedAt: number;

const RootSuspenseFallback: FC = () => {
  const forceUpdate = useForceUpdate();

  useEffect(() => {
    if (!startedAt) {
      startedAt = Date.now();
    }
    if (startedAt + DELAY > Date.now()) {
      const t = setTimeout(forceUpdate, DELAY - (Date.now() - startedAt));
      return () => clearTimeout(t);
    }
    return undefined;
  }, [forceUpdate]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div>
        <Spinner theme="gray" className="w-20" />
      </div>
    </div>
  );
};

export default RootSuspenseFallback;
