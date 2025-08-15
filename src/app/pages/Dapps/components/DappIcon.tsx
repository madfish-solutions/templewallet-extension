import React, { memo, useMemo } from 'react';

import { IdenticonInitials } from 'app/atoms/Identicon';
import { ImageStacked } from 'lib/ui/ImageStacked';

const DEFAULT_CLASSNAMES = 'w-9 h-9 rounded-full';

interface DAppIconProps {
  name: string;
  logo: string;
}

export const DAppIcon = memo<DAppIconProps>(({ name, logo }) => {
  const fallbackElement = useMemo(() => <IdenticonInitials value={name} className={DEFAULT_CLASSNAMES} />, [name]);

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
});
