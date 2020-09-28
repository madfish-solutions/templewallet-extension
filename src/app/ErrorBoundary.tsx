import * as React from "react";
import classNames from "clsx";
import { cache } from "swr";
import { ReactComponent as DangerIcon } from "app/icons/danger.svg";

type ErrorBoundaryProps = {
  className?: string;
  whileMessage?: string;
};

type ErrorBoundaryState = {
  error: Error | null;
};

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error: error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (process.env.NODE_ENV === "development") {
      console.error(error.message, errorInfo.componentStack);
    }
  }

  componentDidMount() {
    window.addEventListener("reseterrorboundary", () => {
      if (this.state.error) {
        this.tryAgain();
      }
    });
  }

  tryAgain() {
    const err = this.state.error as any;
    if (err?.swrErrorKey) {
      cache.delete(err.swrErrorKey, false);
    }

    this.setState({ error: null });
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
                "border border-black border-opacity-5",
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
