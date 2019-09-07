import * as React from "react";

export default class ErrorBoundary extends React.Component {
  state = { hasError: false };

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ hasError: true }, () => {
      // TODO: Make it visible only for Staging environment
      console.error(error, errorInfo);
    });
  }

  render() {
    if (this.state.hasError) {
      // TODO: Make it pretty :3
      return (
        <div>
          <h2>Oops! Something went wrong;(</h2>
          <p>Please, try again later...</p>
        </div>
      );
    }

    return this.props.children;
  }
}
