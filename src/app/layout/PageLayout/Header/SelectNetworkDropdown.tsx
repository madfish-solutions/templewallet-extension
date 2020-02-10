import * as React from "react";
import classNames from "clsx";
import useOnClickOutside from "use-onclickoutside";

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

const SelectNetworkDropdown: React.FC = () => {
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
    <div className="relative">
      <button
        className={classNames(
          "px-4 py-2",
          "border-2 border-primary-orange-lighter hover:border-white",
          "text-primary-orange-lighter hover:text-white",
          "text-base font-medium",
          "rounded",
          "flex items-center"
        )}
        style={{ transition: "all 0.3s" }}
        onClick={handleClick}
      >
        <div
          className="mr-4 w-4 h-4 rounded-full border border-white"
          style={{ backgroundColor: network.color }}
        />
        <span className="text-base">{network.label}</span>
        <SortingIcon className="ml-2" style={{ height: 24, width: "auto" }} />
      </button>
      {opened && (
        <div
          ref={ref}
          className={classNames(
            "absolute right-0",
            "bg-black w-64 p-4",
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

const SortingIcon: React.FC<React.SVGProps<any>> = props => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    stroke="#fff"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-labelledby="sortingIconTitle"
    color="#fff"
    viewBox="0 0 24 24"
    {...props}
  >
    <path d="M8 8.333L12 4.333 16 8.333 16 8.333" />
    <path d="M16 15.667L12 19.667 8 15.667 8 15.667" />
  </svg>
);
