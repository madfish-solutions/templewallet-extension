import React, { memo } from 'react';

import { ReactComponent as UnknownCollectible } from 'app/icons/unknown-collectible.svg';
import { ImageStacked } from 'lib/ui/ImageStacked';
import type { ImageSourceStage } from 'lib/ui/race-image-urls';
import { EMPTY_FROZEN_ARRAY } from 'lib/utils';

interface Props {
  title?: string;
  logoSources?: ImageSourceStage[];
}

export const CollectionDetails = memo<Props>(({ title, logoSources = EMPTY_FROZEN_ARRAY }) =>
  title ? (
    <div className="flex items-center mt-2">
      <div className="relative w-6 h-6 rounded overflow-hidden">
        <ImageStacked
          sources={logoSources}
          immediate
          progressive
          alt="Collection logo"
          className="w-full h-full"
          fallback={<UnknownCollectible className="w-full h-full" />}
        />
      </div>
      <div className="text-font-regular text-grey-1 ml-1 max-w-80 truncate">{title}</div>
    </div>
  ) : null
);
