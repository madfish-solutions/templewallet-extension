import React, { FC } from "react";

import { TempleDAppMetadata } from "@temple-wallet/dapp/dist/types";
import classNames from "clsx";

import Logo from "app/atoms/Logo";
import Name from "app/atoms/Name";
import { ReactComponent as LayersIcon } from "app/icons/layers.svg";
import { ReactComponent as OkIcon } from "app/icons/ok.svg";
import DAppLogo from "app/templates/DAppLogo";

type ConnectBannerProps = {
  type: "connect" | "confirm_operations";
  origin: string;
  appMeta: TempleDAppMetadata;
  className?: string;
};

const ConnectBanner: FC<ConnectBannerProps> = ({
  type,
  origin,
  appMeta,
  className,
}) => {
  const Icon = type === "connect" ? OkIcon : LayersIcon;

  return (
    <div
      className={classNames(
        "w-full flex items-center justify-around",
        className
      )}
    >
      <div
        className={classNames(
          "w-32",
          "border border-gray-200 rounded",
          "flex flex-col items-center",
          "p-2"
        )}
      >
        <DAppLogo origin={origin} size={32} className="flex-shrink-0 mb-1" />

        <span className="text-xs font-semibold text-gray-700">
          <Name style={{ maxWidth: "7.5rem" }}>{appMeta.name}</Name>
        </span>
      </div>

      <div className="relative flex-1 h-px bg-gray-300">
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={classNames(
              type === "connect" ? "bg-green-500" : "bg-orange-500",
              "rounded-full",
              "p-1",
              "flex items-center justify-center",
              "text-white"
            )}
          >
            <Icon className="w-auto h-4 stroke-current stroke-2" />
          </div>
        </div>
      </div>

      <div
        className={classNames(
          "w-32",
          "border border-gray-200 rounded",
          "flex flex-col items-center",
          "p-2"
        )}
      >
        <Logo className="mb-1" style={{ height: 32, margin: "auto" }} />

        <span className="text-xs font-semibold text-gray-700">Temple</span>
      </div>
    </div>
  );
};

export default ConnectBanner;
