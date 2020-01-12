import * as React from "react";
import * as ReactDOM from "react-dom";

const App: React.FC = () => (
  <div className="p-8">
    <h1 className="text-lg">Welcome</h1>
  </div>
);

ReactDOM.render(<App />, document.getElementById("root"));
