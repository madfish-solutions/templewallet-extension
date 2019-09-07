import * as React from "react";
import useConseilJSContext from "lib/useConseilJSContext";
import useThanosSDKContext from "lib/useThanosSDKContext";
import useAccountContext from "lib/useAccountContext";
import useThanosContext from "lib/useThanosContext";

const ContextProvider: React.FC = ({ children }) => {
  return (
    <useConseilJSContext.Provider>
      <useThanosSDKContext.Provider>
        <useAccountContext.Provider>
          <useThanosContext.Provider>{children}</useThanosContext.Provider>
        </useAccountContext.Provider>
      </useThanosSDKContext.Provider>
    </useConseilJSContext.Provider>
  );
};

export default ContextProvider;
