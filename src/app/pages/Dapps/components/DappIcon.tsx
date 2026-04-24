import React, { FC } from 'react';

import { IdenticonInitials } from 'app/atoms/Identicon';
import { ImageStacked } from 'lib/ui/ImageStacked';

const DEFAULT_CLASSNAMES = 'w-9 h-9 rounded-full';

interface DAppIconProps {
  name: string;
  logo: string;
}

export const DAppIcon: FC<DAppIconProps> = ({ name, logo }) => {
  const fallbackElement = <IdenticonInitials value={name} className={DEFAULT_CLASSNAMES} />;

  return (
    <div className="flex justify-center items-center w-10 h-10">
      <ImageStacked
        sources={[logo]}
        className={DEFAULT_CLASSNAMES}
        alt={name}
        loader={fallbackElement}
        fallback={fallbackElement}
      />
    </div>
  );
};
