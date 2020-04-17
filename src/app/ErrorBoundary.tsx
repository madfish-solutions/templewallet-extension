import * as React from "react";
import classNames from "clsx";
import { cache } from "swr";
import { ReactComponent as DangerIcon } from "app/icons/danger.svg";

type ErrorBoundaryProps = {
  className?: string;
  whileMessage?: React.ReactNode;
};

type ErrorBoundaryState = {
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
};

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps> {
  state: ErrorBoundaryState = { error: null, errorInfo: null };

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo }, () => {
      if (process.env.NODE_ENV === "development") {
        console.error(error, errorInfo);
      }
    });
  }

  tryAgain() {
    const { error } = this.state;
    if (error && (error as any).swrErrorKey) {
      cache.set((error as any).swrErrorKey, undefined, false);
    }

    this.setState({ error: null, errorInfo: null });
  }

  render() {
    if (this.state.error) {
      const online = getOnlineStatus();

      return (
        <div
          className={classNames(
            "w-full",
            "flex items-center justify-center",
            this.props.className
          )}
        >
          <div
            className={classNames(
              "max-w-xs",
              "p-4",
              "flex flex-col items-center",
              "text-red-600"
            )}
          >
            <DangerIcon className="h-16 w-auto stroke-current" />

            <h2 className="mb-1 text-2xl">Oops!</h2>

            <p className="mb-4 text-sm opacity-90 text-center font-light">
              Something went wrong
              {this.props.whileMessage ? (
                <> while {this.props.whileMessage}</>
              ) : null}
              {!online && ". This may happen because you are currently offline"}
            </p>

            <button
              className={classNames(
                "mb-6",
                "px-4 py-1",
                "bg-red-500 rounded",
                "border border-black-5",
                "flex items-center",
                "text-white text-shadow-black",
                "text-sm font-semibold",
                "transition duration-300 ease-in-out",
                "opacity-90 hover:opacity-100",
                "shadow-sm hover:shadow"
              )}
              onClick={() => this.tryAgain()}
            >
              Try again
            </button>

            {/* {process.env.NODE_ENV === "development" && (
              <p className="whitespace-pre-wrap">
                {this.state.error.toString()}
                <br />
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </p>
            )} */}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function getOnlineStatus() {
  return typeof navigator !== "undefined" &&
    typeof navigator.onLine === "boolean"
    ? navigator.onLine
    : true;
}
