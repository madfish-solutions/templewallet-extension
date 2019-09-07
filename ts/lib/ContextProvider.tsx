import * as React from "react";
import useConseilJSContext from "lib/useConseilJSContext";
import useAccountContext from "lib/useAccountContext";
import useThanosContext from "lib/useThanosContext";

const ContextProvider: React.FC = ({ children }) => {
  return (
    <useConseilJSContext.Provider>
      <useAccountContext.Provider>
        <useThanosContext.Provider>{children}</useThanosContext.Provider>
      </useAccountContext.Provider>
    </useConseilJSContext.Provider>
  );
};

export default ContextProvider;
