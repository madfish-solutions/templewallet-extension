import * as React from "react";
import * as ReactDOM from "react-dom";

const Welcome: React.FC = () => (
  <div className="p-4">
    <h1 className="text-xl font-semibold mb-2">Welcome</h1>
    <p>Now, you have item in your toolbar. Open it to start!</p>
  </div>
);

ReactDOM.render(<Welcome />, document.getElementById("root"));
