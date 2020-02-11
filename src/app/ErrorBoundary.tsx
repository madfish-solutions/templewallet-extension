import * as React from "react";
import classNames from "clsx";

type ErrorBoundaryState = {
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
};

export default class ErrorBoundary extends React.Component {
  state: ErrorBoundaryState = { error: null, errorInfo: null };

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo }, () => {
      if (process.env.NODE_ENV === "development") {
        console.error(error, errorInfo);
      }
    });
  }

  render() {
    if (this.state.error) {
      return (
        <div
          className={classNames(
            "w-full min-h-screen",
            "flex items-center justify-center"
          )}
        >
          <div className={classNames("max-w-sm", "p-4")}>
            <h2 className="my-2 text-lg">Oops! Something went wrong.</h2>

            {process.env.NODE_ENV === "development" && (
              <p className="whitespace-pre-wrap">
                {this.state.error.toString()}
                <br />
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
