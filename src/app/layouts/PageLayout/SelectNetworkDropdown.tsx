import * as React from "react";
import classNames from "clsx";
import Popper from "lib/Popper";
import { ReactComponent as ChevronDownIcon } from "app/icons/chevron-down.svg";

const NETWORKS = [
  {
    disabled: false,
    id: "testnet",
    label: "Babylon testnet",
    color: "#29b6af"
  },
  {
    disabled: true,
    id: "mainnet",
    label: "Babylon mainnet",
    color: "#ff4a8d"
  }
];

type NetworkDropdownProps = React.HTMLAttributes<HTMLDivElement>;

const NetworkDropdown: React.FC<NetworkDropdownProps> = ({
  className,
  ...rest
}) => {
  const [network, setNetwork] = React.useState(() => NETWORKS[0]);

  return (
    <Popper
      popper={{
        placement: "bottom",
        strategy: "fixed"
      }}
      trigger={({ opened }) => (
        <button
          className={classNames(
            "px-2 py-1",
            "bg-white-10 rounded",
            "border border-primary-orange-25",
            "text-primary-white text-shadow-black",
            "text-xs font-medium",
            "transition ease-in-out duration-200",
            opened ? "shadow-md" : "shadow hover:shadow-md focus:shadow-md",
            opened
              ? "opacity-100"
              : "opacity-90 hover:opacity-100 focus:opacity-100",
            "flex items-center",
            "select-none"
          )}
        >
          <div
            className={classNames(
              "mr-2",
              "w-3 h-3",
              "border border-primary-white",
              "rounded-full",
              "shadow-xs"
            )}
            style={{ backgroundColor: network.color }}
          />

          <span>{network.label}</span>

          <ChevronDownIcon
            className="ml-1 -mr-1 stroke-current stroke-2"
            style={{ height: 16, width: "auto" }}
          />
        </button>
      )}
    >
      {({ setOpened }) => (
        <div
          className={classNames(
            "mt-2",
            "border",
            "rounded overflow-hidden",
            "shadow-xl",
            "p-2"
          )}
          style={{
            backgroundColor: "#272727",
            borderColor: "#4c4c4c"
          }}
        >
          {NETWORKS.map(net => {
            const { id, label, color, disabled } = net;
            const selected = network.id === id;

            return (
              <button
                key={id}
                className={classNames(
                  "w-full",
                  "mb-1",
                  "rounded",
                  "px-2 py-1",
                  "transition easy-in-out duration-200",
                  !disabled && (selected ? "bg-white-10" : "hover:bg-white-5"),
                  disabled ? "cursor-default" : "cursor-pointer",
                  "flex items-center",
                  disabled && "opacity-25"
                )}
                disabled={disabled}
                onClick={() => {
                  if (!disabled) {
                    if (network.id !== net.id) {
                      setNetwork(net);
                    }
                    setOpened(false);
                  }
                }}
              >
                <div
                  className="mr-2 w-3 h-3 rounded-full border border-white"
                  style={{ backgroundColor: color }}
                />
                <span className="text-white text-sm">{label}</span>
              </button>
            );
          })}
        </div>
      )}
    </Popper>
  );
};

export default NetworkDropdown;
