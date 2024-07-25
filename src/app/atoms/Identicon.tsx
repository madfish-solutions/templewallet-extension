import React, { HTMLAttributes, memo, useMemo } from 'react';

import clsx from 'clsx';

import { IdenticonType, getIdenticonUri } from 'lib/temple/front';

type IdenticonProps = HTMLAttributes<HTMLDivElement> & {
  type?: IdenticonType;
  hash: string;
  size?: number;
};

export const Identicon = memo<IdenticonProps>(
  ({ type = 'jdenticon', hash, size = 100, className, style = {}, ...rest }) => {
    const backgroundImage = useMemo(() => getIdenticonUri(hash, size, type), [hash, size, type]);

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
  }
);
