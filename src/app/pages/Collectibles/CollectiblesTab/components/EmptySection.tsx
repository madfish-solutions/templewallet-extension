import React, { memo } from 'react';

import { ReactComponent as EmptySearchIcon } from 'app/icons/search_empty.svg';
import { T } from 'lib/i18n';

export const EmptySection = memo(() => (
  <div className="flex-1 py-7 flex flex-col items-center justify-center text-grey-2">
    <EmptySearchIcon />

    <p className="mt-2 text-center text-font-medium-bold">
      <T id="notFound" />
    </p>
  </div>
));
