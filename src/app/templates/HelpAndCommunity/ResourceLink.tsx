import React, { FC, SVGProps } from 'react';

import { Anchor } from 'app/atoms/Anchor';
import { TestIDProps } from 'lib/analytics';

interface Props extends TestIDProps {
  title: string;
  href: string;
  background?: string;
  Icon: React.FC<SVGProps<SVGSVGElement>>;
}

export const ResourceLink: FC<Props> = ({ title, href, background, Icon, testID, testIDProperties }) => {
  return (
    <li>
      <Anchor
        href={href}
        className="flex items-center py-1 my-1 hover:underline text-blue-600"
        testID={testID}
        testIDProperties={testIDProperties}
      >
        <div
          className="mr-4 w-8 h-8 flex justify-center items-center rounded-md"
          style={{ background, padding: background ? '0.375rem' : 0 }}
        >
          <Icon className="h-full w-auto" />
        </div>
        {title}
      </Anchor>
    </li>
  );
};
