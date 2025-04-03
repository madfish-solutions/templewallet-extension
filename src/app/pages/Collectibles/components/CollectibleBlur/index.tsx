import React, { memo, useMemo } from 'react';

import clsx from 'clsx';

import { ReactComponent as RevealEyeSvg } from 'app/icons/reveal-eye.svg';
import { buildObjktMediaUriForItemPath } from 'lib/images-uri';
import { TokenMetadata } from 'lib/metadata';
import { useBooleanState } from 'lib/ui/hooks';

import { CollectibleImageLoader } from '../CollectibleImageLoader';

interface Props {
  metadata: TokenMetadata;
  large?: boolean;
  onClick?: EmptyFn;
}

export const CollectibleBlur = memo<Props>(({ metadata, large = false, onClick }) => {
  const [isLoading, _, setLoaded] = useBooleanState(true);

  const source = useMemo(() => {
    const { address, id } = metadata;

    return buildObjktMediaUriForItemPath(`${address}/${id}`, 'thumb288');
  }, [metadata]);

  return (
    <>
      {isLoading && <CollectibleImageLoader large={large} />}
      <div
        onClick={onClick}
        className={clsx(
          'relative flex justify-center items-center h-full w-full',
          isLoading && 'hidden',
          onClick && 'cursor-pointer'
        )}
      >
        <img
          src={source}
          alt="Adult content"
          onLoad={setLoaded}
          className={clsx('w-full h-full', large ? 'blur' : 'blur-sm')}
        />
        <RevealEyeSvg className={clsx('absolute z-20', large ? 'w-23 h-23' : 'w-8 h-8')} />
      </div>
    </>
  );
});
