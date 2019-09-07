import * as React from "react";
import classNames from "clsx";
import useOnClickOutside from "lib/useClickOutside";

const NETWORKS = [
  {
    key: "mainnet",
    label: "Main Tezos Network",
    color: "#29b6af"
  },
  {
    key: "alphanet",
    label: "Alpha Test Network",
    color: "#ff4a8d"
  }
];

const SelectNetworkDropdown: React.FC = () => {
  const [selectedNetwork, setSelectedNetwork] = React.useState(NETWORKS[0]);

  const ref = React.useRef(null);
  const [opened, setOpened] = React.useState(false);
  const handleClick = React.useCallback(evt => {
    evt.preventDefault();
    setOpened(!opened);
  }, []);

  useOnClickOutside(ref, () => {
    setOpened(false);
  });

  return (
    <div className="relative">
      <button
        className={classNames(
          "px-4 py-2",
          "border-2 border-orange-200 hover:border-white",
          "text-orange-200 hover:text-white",
          "text-base font-medium",
          "rounded",
          "flex items-center"
        )}
        style={{ transition: "all 0.3s" }}
        onClick={handleClick}
      >
        <div
          className="mr-4 w-4 h-4 rounded-full border border-white"
          style={{ backgroundColor: selectedNetwork.color }}
        />
        <span className="text-base">{selectedNetwork.label}</span>
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
            const { key, label, color } = net;

            return (
              <button
                key={key}
                className={classNames(
                  "w-full rounded p-4",
                  "hover:bg-white-alpha-005",
                  "cursor-pointer",
                  "flex items-center"
                )}
                onClick={() => {
                  setSelectedNetwork(net);
                  setOpened(false);
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
