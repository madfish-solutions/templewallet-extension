import React, { memo } from 'react';

import { ReactComponent as UnknownCollectible } from 'app/icons/unknown-collectible.svg';
import { ImageStacked } from 'lib/ui/ImageStacked';

interface Props {
  title?: string;
  logoSources?: string[];
}

export const CollectionDetails = memo<Props>(({ title, logoSources = [] }) =>
  title ? (
    <div className="flex items-center mt-2">
      <ImageStacked
        sources={logoSources}
        fallback={<UnknownCollectible className="w-6 h-6" />}
        className="w-6 h-6 rounded border"
      />
      <div className="text-font-regular text-grey-1 ml-1">{title}</div>
    </div>
  ) : null
);
