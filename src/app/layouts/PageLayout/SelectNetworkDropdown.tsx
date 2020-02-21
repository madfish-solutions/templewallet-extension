import * as React from "react";
import classNames from "clsx";
import useOnClickOutside from "use-onclickoutside";
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

type SelectNetworkDropdownProps = {
  className?: string;
};

const SelectNetworkDropdown: React.FC<SelectNetworkDropdownProps> = ({
  className
}) => {
  const [network, setNetwork] = React.useState(() => NETWORKS[0]);

  const ref = React.useRef(null);
  const [opened, setOpened] = React.useState(false);
  const handleClick = React.useCallback(
    evt => {
      evt.preventDefault();
      setOpened(o => !o);
    },
    [setOpened]
  );

  const handleClickOuside = React.useCallback(() => {
    setOpened(false);
  }, [setOpened]);
  useOnClickOutside(ref, handleClickOuside);

  return (
    <div className={classNames("relative", className)}>
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
        onClick={handleClick}
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

      {opened && (
        <div
          ref={ref}
          className={classNames(
            "absolute right-0 z-50",
            "bg-black w-64 p-2",
            "rounded overflow-hidden shadow"
          )}
          style={{ top: "120%", backgroundColor: "rgba(0, 0, 0, 0.9)" }}
        >
          {NETWORKS.map(net => {
            const { id, label, color, disabled } = net;

            return (
              <button
                key={id}
                className={classNames(
                  "w-full rounded p-4",
                  !disabled && "hover:bg-white-alpha-005",
                  !disabled ? "cursor-pointer" : "cursor-default",
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
                  className="mr-4 w-4 h-4 rounded-full border border-white"
                  style={{ backgroundColor: color }}
                />
                <span className="text-white text-base">{label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SelectNetworkDropdown;
