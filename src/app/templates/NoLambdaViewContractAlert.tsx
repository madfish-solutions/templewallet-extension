import * as React from "react";
import classNames from "clsx";
import { Link } from "lib/woozie";
import { useRetryableSWR } from "lib/swr";
import {
  useTezos,
  useNetwork,
  loadChainId,
  useTempleClient,
} from "lib/temple/front";
import { T } from "lib/i18n/react";
import { useAppEnv } from "app/env";
import { ReactComponent as ErrorIcon } from "app/icons/error.svg";

const ConditionalNoLambdaViewContractAlert: React.FC = () => {
  const { ready } = useTempleClient();
  return ready ? <NoLambdaViewContractAlert /> : null;
};

export default ConditionalNoLambdaViewContractAlert;

const NoLambdaViewContractAlert: React.FC = () => {
  const { fullPage } = useAppEnv();
  const tezos = useTezos();
  const network = useNetwork();

  const contractCheckSWR = useRetryableSWR(
    ["contract-check", tezos.checksum, network.lambdaContract],
    async () => {
      try {
        await loadChainId(tezos.rpc.getRpcUrl());
        return Boolean(
          network.lambdaContract &&
            (await tezos.contract.at(network.lambdaContract))
        );
      } catch {
        return true;
      }
    },
    {
      revalidateOnFocus: false,
      suspense: false,
    }
  );
  const displayed = !contractCheckSWR.isValidating && !contractCheckSWR.data;

  return displayed ? (
    <div className="fixed bottom-0 w-full z-50">
      <div
        className={classNames(
          "w-full max-w-screen-sm mx-auto",
          "py-4",
          fullPage ? "px-8" : "px-4"
        )}
      >
        <Link
          to="/settings/networks"
          className={classNames(
            "block rounded-full",
            "transition ease-in-out duration-300",
            "bg-yellow-500",
            "shadow-sm hover:shadow",
            "p-2",
            "flex items-center",
            "text-yellow-100 leading-none"
          )}
          role="alert"
        >
          <span
            className={classNames(
              "mr-3",
              "rounded-full",
              "bg-yellow-400",
              "px-1 py-1",
              "flex items-center",
              "uppercase text-sm font-bold"
            )}
          >
            <ErrorIcon className="stroke-current stroke-2 h-4 w-auto" />
          </span>

          <span className="mr-2 flex-auto text-left text-xs font-semibold">
            <T id="noActiveNetLambdaWarningTitle" />
          </span>

          <svg
            className="fill-current opacity-75 h-4 w-4 flex-shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
          >
            <path d="M12.95 10.707l.707-.707L8 4.343 6.586 5.757 10.828 10l-4.242 4.243L8 15.657l4.95-4.95z" />
          </svg>
        </Link>
      </div>
    </div>
  ) : null;
};
