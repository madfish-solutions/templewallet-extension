import React from "react";

import classNames from "clsx";

import { useAppEnv } from "app/env";

type DAppIconProps = {
  name: string;
  logo: string;
  className?: string;
};

const DAppIcon: React.FC<DAppIconProps> = ({ name, logo, className }) => {
  const { popup } = useAppEnv();
  return (
    <div
      className={classNames(
        "bg-white border border-gray-300 rounded-2xl flex justify-center items-center",
        !popup && "w-20 h-20",
        className
      )}
      style={popup ? { width: "4.5rem", height: "4.5rem" } : undefined}
    >
      {logo ? (
        <img className="rounded-2xl" alt={name} src={logo} />
      ) : (
        <span className="text-gray-700 text-xs">{name}</span>
      )}
    </div>
  );
};

export default DAppIcon;
