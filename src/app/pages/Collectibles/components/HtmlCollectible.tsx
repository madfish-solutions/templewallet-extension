import React, { FC } from 'react';

import { emptyFn } from '@rnw-community/shared';
import clsx from 'clsx';

interface Props {
  uri: string;
  title?: string;
  className?: string;
  onError?: EmptyFn;
}

/** Untrusted HTML. `allow-scripts` runs the artwork. `allow-same-origin` stays off so it cannot reach the extension. */
export const HtmlCollectible: FC<Props> = ({ uri, title = 'Collectible', className, onError = emptyFn }) => (
  <iframe
    src={uri}
    title={title}
    sandbox="allow-scripts"
    referrerPolicy="no-referrer"
    className={clsx('h-full w-full border-0 bg-transparent', className)}
    onError={onError}
  />
);
