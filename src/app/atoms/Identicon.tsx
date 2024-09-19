import React, { HTMLAttributes, useMemo } from 'react';

import clsx from 'clsx';

import { IdenticonType, getIdenticonUri } from 'lib/temple/front';
import { IdenticonOptions } from 'lib/temple/front/identicon';

type IdenticonProps<T extends IdenticonType> = HTMLAttributes<HTMLDivElement> & {
  type: T;
  hash: string;
  size?: number;
  options?: IdenticonOptions<T>;
};

export const Identicon = <T extends IdenticonType>({
  type,
  hash,
  size = 100,
  className,
  style = {},
  options,
  ...rest
}: IdenticonProps<T>) => {
  const backgroundImage = useMemo(() => getIdenticonUri(hash, size, type, options), [hash, options, size, type]);

  return (
    <div
      className={clsx(
        type === 'initials' ? 'bg-transparent' : 'bg-white',
        'bg-no-repeat bg-center inline-block overflow-hidden',
        className
      )}
      style={style}
      {...rest}
    >
      <img src={backgroundImage} alt="" style={{ width: size, height: size }} />
    </div>
  );
};
