import * as React from "react";

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
        <div>
          {process.env.NODE_ENV === "development"
            ? JSON.stringify(this.state.error)
            : "Oops, error;("}
        </div>
      );
    }

    return this.props.children;
  }
}
