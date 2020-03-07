import * as React from "react";
import classNames from "clsx";
import Popper from "lib/ui/Popper";
import DropdownWrapper from "app/atoms/DropdownWrapper";
import { ReactComponent as ChevronDownIcon } from "app/icons/chevron-down.svg";
import { ReactComponent as SignalAltIcon } from "app/icons/signal-alt.svg";

const NETWORKS = [
  {
    disabled: false,
    id: "mainnet",
    label: "Tezos Mainnet",
    color: "#83b300"
  },
  {
    disabled: false,
    id: "babylonnet",
    label: "Babylonnet",
    color: "#ed6663"
  },
  {
    disabled: false,
    id: "zeronet",
    label: "Zeronet",
    color: "#e9e1cc"
  },
  {
    disabled: false,
    id: "carthagenet",
    label: "Carthagenet",
    color: "#0f4c81"
  },
  {
    disabled: false,
    id: "labnet",
    label: "Labnet",
    color: "#f6c90e"
  }
];

type NetworkSelectProps = React.HTMLAttributes<HTMLDivElement>;

const NetworkSelect: React.FC<NetworkSelectProps> = () => {
  const [network, setNetwork] = React.useState(() => NETWORKS[0]);

  return (
    <Popper
      placement="bottom"
      strategy="fixed"
      popup={({ opened, setOpened }) => (
        <DropdownWrapper opened={opened}>
          <h2
            className={classNames(
              "mb-2",
              "border-b border-white-25",
              "px-1 pb-1",
              "flex items-center",
              "text-white-90 text-sm text-center"
            )}
          >
            <SignalAltIcon className="mr-1 h-4 w-auto stroke-current" />
            Networks
          </h2>

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
                  "transition easy-in-out duration-200",
                  !disabled && (selected ? "bg-white-10" : "hover:bg-white-5"),
                  disabled ? "cursor-default" : "cursor-pointer",
                  "flex items-center",
                  disabled && "opacity-25"
                )}
                style={{
                  padding: "0.375rem 1.5rem 0.375rem 0.5rem"
                }}
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
                  className={classNames(
                    "mr-2 w-3 h-3",
                    "border border-primary-white",
                    "rounded-full",
                    "shadow-xs"
                  )}
                  style={{ backgroundColor: color }}
                />
                <span className="text-white text-sm text-shadow-black">
                  {label}
                </span>
              </button>
            );
          })}
        </DropdownWrapper>
      )}
    >
      {({ ref, opened, toggleOpened }) => (
        <button
          ref={ref}
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
          onClick={toggleOpened}
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
    </Popper>
  );
};

export default NetworkSelect;
