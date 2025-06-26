import React, { FC, HTMLAttributes, ImgHTMLAttributes, useMemo } from 'react';

import clsx from 'clsx';

import {
  IdenticonImgType,
  ImageIdenticonOptions,
  InitialsIdenticonOptions,
  buildImageIdenticonUri,
  buildInitialsIdenticonUri
} from 'lib/identicon';

interface IdenticonProps<T extends IdenticonImgType> extends HTMLAttributes<HTMLDivElement> {
  type: T;
  hash: string;
  size?: number;
  options?: ImageIdenticonOptions<T>;
}

export const Identicon = <T extends IdenticonImgType>({
  type,
  hash,
  size = 100,
  className,
  style = {},
  options,
  ...rest
}: IdenticonProps<T>) => {
  const backgroundImage = useMemo(() => buildImageIdenticonUri(hash, size, type, options), [hash, options, size, type]);

  return (
    <div
      className={clsx(
        'bg-white overflow-hidden',
        'inline-block bg-no-repeat bg-center', // (!) Why?
        className
      )}
      style={{ width: size, height: size, ...style }}
      {...rest}
    >
      <img src={backgroundImage} alt="" className="w-full h-full" />
    </div>
  );
};

interface IdenticonInitialsProps extends ImgHTMLAttributes<HTMLImageElement> {
  value: string;
  options?: InitialsIdenticonOptions;
}

export const IdenticonInitials: FC<IdenticonInitialsProps> = ({ value, options, ...props }) => {
  const src = useMemo(() => buildInitialsIdenticonUri(value, options), [options, value]);

  return <img src={src} {...props} />;
};
