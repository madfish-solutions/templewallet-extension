import { FC } from 'react';

import clsx from 'clsx';

import { ReactComponent as RevealEyeSvg } from 'app/icons/reveal-eye.svg';
import { fromFa2TokenSlug } from 'lib/assets/utils';
import { useBooleanState } from 'lib/ui/hooks';
import { buildObjktTokenThumbnailUrl } from 'lib/utils/objkt-cdn';

import { CollectibleImageLoader } from './collectible-image-loader';

interface Props {
  assetSlug: string;
  large?: boolean;
  eyeIconSizeClassName?: string;
  onClick?: EmptyFn;
}

export const CollectibleBlur: FC<Props> = ({ assetSlug, large = false, eyeIconSizeClassName, onClick }) => {
  const [isLoading, , setLoaded] = useBooleanState(true);

  const { contract, id } = fromFa2TokenSlug(assetSlug);

  const source = buildObjktTokenThumbnailUrl(contract, id);

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
          className={clsx('w-full h-full', large ? 'blur' : 'blur-xs')}
        />
        <RevealEyeSvg className={clsx('absolute z-20', eyeIconSizeClassName ?? (large ? 'w-23 h-23' : 'w-8 h-8'))} />
      </div>
    </>
  );
};
