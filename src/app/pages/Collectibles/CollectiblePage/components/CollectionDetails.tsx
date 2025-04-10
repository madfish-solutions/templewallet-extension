import React, { memo } from 'react';

import { ReactComponent as UnknownCollectible } from 'app/icons/unknown-collectible.svg';
import { useBooleanState } from 'lib/ui/hooks';

interface Props {
  title?: string;
  logoSrc?: string;
}

export const CollectionDetails = memo<Props>(({ title, logoSrc }) => {
  const [logoLoadingFailed, setLogoLoadingFailed] = useBooleanState(!logoSrc);

  return title ? (
    <div className="flex items-center mt-2">
      <div className="w-6 h-6 rounded overflow-hidden">
        {logoLoadingFailed ? (
          <UnknownCollectible className="w-full h-full" />
        ) : (
          <img src={logoSrc} alt="Collection logo" className="w-full h-full" onError={setLogoLoadingFailed} />
        )}
      </div>
      <div className="text-font-regular text-grey-1 ml-1 max-w-80 truncate">{title}</div>
    </div>
  ) : null;
});
