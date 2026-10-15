import React, { FC, HTMLAttributes, useMemo } from 'react';

import clsx from 'clsx';

import {
  IdenticonImgType,
  ImageIdenticonOptions,
  InitialsIdenticonOptions,
  buildImageIdenticonUri,
  buildInitialsIdenticonSvg
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
  const backgroundImage = buildImageIdenticonUri(hash, size, type, options);

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

interface IdenticonInitialsProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children' | 'dangerouslySetInnerHTML'> {
  value: string;
  options?: InitialsIdenticonOptions;
  width?: number | string;
  height?: number | string;
}

export const IdenticonInitials: FC<IdenticonInitialsProps> = ({
  value,
  options,
  className,
  style,
  width,
  height,
  ...props
}) => {
  const svg = useMemo(() => buildInitialsIdenticonSvg(value, options), [options, value]);

  return (
    <span
      {...props}
      className={clsx('block shrink-0 overflow-hidden [&>svg]:w-full [&>svg]:h-full', className)}
      style={{ width, height, ...style }}
      aria-hidden="true"
      /* escaped in lib/first-letters */
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};
