import React from "react";

import classNames from "clsx";

type DAppIconProps = {
  name: string;
  logo: string;
  className?: string;
};

const DAppIcon: React.FC<DAppIconProps> = ({ name, logo, className }) => (
  <div
    className={classNames(
      "bg-white w-20 h-20 border border-gray-300 rounded-2xl flex justify-center items-center",
      className
    )}
  >
    {logo ? (
      <img className="rounded-2xl" alt={name} src={logo} />
    ) : (
      <span className="text-gray-700 text-xs">{name}</span>
    )}
  </div>
);

export default DAppIcon;
