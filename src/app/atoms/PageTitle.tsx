import React, { FC } from 'react';

interface Props {
  icon: JSX.Element;
  title: string;
}

export const PageTitle: FC<Props> = ({ icon, title }) => (
  <div className="flex flex-row items-center">
    {icon}
    <span className="font-normal text-sm ml-1">{title}</span>
  </div>
);
