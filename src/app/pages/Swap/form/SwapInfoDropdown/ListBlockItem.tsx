import { FC, Ref } from 'react';

import { Divider, IconBase } from 'app/atoms';
import { T, TID } from 'lib/i18n';

type ListBlockItemProps = PropsWithChildren<{
  title: TID;
  divide?: boolean;
  Icon?: ImportedSVGComponent;
  tooltipText?: string;
  substitutions?: string[];
  ref?: Ref<HTMLSpanElement>;
}>;

export const ListBlockItem: FC<ListBlockItemProps> = ({ Icon, title, divide = true, children, substitutions, ref }) => (
  <>
    {divide && <Divider thinest />}
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
);
