import * as React from "react";
import classNames from "clsx";
import {
  useAllNetworks,
  useNetwork,
  useSetNetworkId,
  preloadTokens,
} from "lib/temple/front";
import Popper from "lib/ui/Popper";
import { T } from "lib/i18n/react";
import DropdownWrapper from "app/atoms/DropdownWrapper";
import Name from "app/atoms/Name";
import { ReactComponent as ChevronDownIcon } from "app/icons/chevron-down.svg";
import { ReactComponent as SignalAltIcon } from "app/icons/signal-alt.svg";

type NetworkSelectProps = React.HTMLAttributes<HTMLDivElement>;

const NetworkSelect: React.FC<NetworkSelectProps> = () => {
  const allNetworks = useAllNetworks();
  const network = useNetwork();
  const setNetworkId = useSetNetworkId();

  const handleNetworkSelect = React.useCallback(
    async (
      netId: string,
      rpcUrl: string,
      selected: boolean,
      setOpened: (o: boolean) => void
    ) => {
      setOpened(false);

      if (!selected) {
        try {
          await preloadTokens(rpcUrl);
        } catch (_err) {}

        setNetworkId(netId);
      }
    },
    [setNetworkId]
  );

  return (
    <Popper
      placement="bottom-end"
      strategy="fixed"
      popup={({ opened, setOpened }) => (
        <DropdownWrapper opened={opened} className="origin-top-right">
          <h2
            className={classNames(
              "mb-2",
              "border-b border-white border-opacity-25",
              "px-1 pb-1",
              "flex items-center",
              "text-white text-opacity-90 text-sm text-center"
            )}
          >
            <SignalAltIcon className="w-auto h-4 mr-1 stroke-current" />
            <T id="networks">{(networks) => <>{networks}</>}</T>
          </h2>

          {allNetworks
            // Don't show hidden (but known) nodes on the dropdown
            .filter((n) => !n.hidden)
            .map(({ id, rpcBaseURL, name, color, disabled, nameI18nKey }) => {
              const selected = id === network.id;

              return (
                <button
                  key={id}
                  className={classNames(
                    "w-full",
                    "mb-1",
                    "rounded",
                    "transition easy-in-out duration-200",
                    !disabled &&
                      (selected
                        ? "bg-white bg-opacity-10"
                        : "hover:bg-white hover:bg-opacity-5"),
                    disabled ? "cursor-default" : "cursor-pointer",
                    "flex items-center",
                    disabled && "opacity-25"
                  )}
                  style={{
                    padding: "0.375rem 1.5rem 0.375rem 0.5rem",
                  }}
                  disabled={disabled}
                  autoFocus={selected}
                  onClick={() => {
                    if (!disabled) {
                      handleNetworkSelect(id, rpcBaseURL, selected, setOpened);
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

                  <span
                    className="overflow-hidden text-sm text-white whitespace-no-wrap text-shadow-black"
                    style={{ textOverflow: "ellipsis", maxWidth: "10rem" }}
                  >
                    {(nameI18nKey && <T id={nameI18nKey} />) || name}
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
            "bg-white bg-opacity-10 rounded",
            "border border-primary-orange border-opacity-25",
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

          <Name style={{ maxWidth: "7rem" }}>
            {(network.nameI18nKey && <T id={network.nameI18nKey} />) ||
              network.name}
          </Name>

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
