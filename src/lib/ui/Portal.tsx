import * as React from "react";
import * as ReactDOM from "react-dom";

const Portal: React.FC = ({ children }) => {
  const portalEl = React.useMemo(() => document.createElement("div"), []);
  React.useEffect(() => {
    document.body.appendChild(portalEl);
    return () => {
      document.body.removeChild(portalEl);
    };
  }, [portalEl]);

  return ReactDOM.createPortal(children, portalEl);
};

export default Portal;
