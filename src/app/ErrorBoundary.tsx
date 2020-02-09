import * as React from "react";
import classNames from "clsx";

export default class ErrorBoundary extends React.Component {
  state = { error: null };

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error }, () => {
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
          <div className="p-4">
            {process.env.NODE_ENV === "development"
              ? JSON.stringify(this.state.error, undefined, 2)
              : "Oops, error;("}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
