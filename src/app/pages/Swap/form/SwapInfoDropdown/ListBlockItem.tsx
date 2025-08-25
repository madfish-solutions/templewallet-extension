import React, { forwardRef } from 'react';

import { Divider, IconBase } from 'app/atoms';
import { T, TID } from 'lib/i18n';

export const ListBlockItem = forwardRef<
  HTMLSpanElement,
  PropsWithChildren<{
    title: TID;
    divide?: boolean;
    Icon?: ImportedSVGComponent;
    tooltipText?: string;
    substitutions?: string[];
  }>
>(({ Icon, title, divide = true, children, substitutions }, ref) => (
  <>
    {divide && <Divider />}
    <div className="flex items-center justify-between min-h-12">
      <span ref={ref} className="flex gap-0.5 items-center cursor-pointer">
        {Icon ? <IconBase Icon={Icon} className="text-grey-1" /> : <span className="w-6 h-6" />}
        <span className="text-font-description text-grey-1">
          <T id={title} substitutions={substitutions} />
        </span>
      </span>
      <span className="p-1 text-font-num-12">{children}</span>
    </div>
  </>
));
