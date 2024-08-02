import React, { memo } from 'react';

import { IconBase } from './IconBase';

interface Props {
  title: string;
  Icon?: ImportedSVGComponent;
}

export const PageTitle = memo<Props>(({ Icon, title }) => (
  <>
    {Icon && <IconBase Icon={Icon} />}

    <span className="ml-1 text-font-regular-bold">{title}</span>
  </>
));
