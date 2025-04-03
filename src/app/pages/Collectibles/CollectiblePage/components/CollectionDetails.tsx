import React, { memo } from 'react';

import { ReactComponent as UnknownCollectible } from 'app/icons/unknown-collectible.svg';
import { ImageStacked } from 'lib/ui/ImageStacked';

const LOGO_FALLBACK_STYLES = { width: 24, height: 24 };

interface Props {
  title?: string;
  logoUrls?: string[];
}

export const CollectionDetails = memo<Props>(({ title, logoUrls = [] }) =>
  title ? (
    <div className="flex items-center gap-x-1">
      <ImageStacked
        sources={logoUrls}
        fallback={<UnknownCollectible style={LOGO_FALLBACK_STYLES} />}
        className="w-6 h-6 rounded border"
      />
      <div className="text-font-regular text-grey-1">{title}</div>
    </div>
  ) : null
);
