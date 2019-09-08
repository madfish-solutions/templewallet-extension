import * as React from "react";
import useConseilJSContext from "lib/useConseilJSContext";
import useNetworkContext from "lib/useNetworkContext";
import useThanosSDKContext from "lib/useThanosSDKContext";
import useAccountContext from "lib/useAccountContext";
import useThanosContext from "lib/useThanosContext";

const ContextProvider: React.FC = ({ children }) => {
  return (
    <useConseilJSContext.Provider>
      <useNetworkContext.Provider>
        <useThanosSDKContext.Provider>
          <useAccountContext.Provider>
            <useThanosContext.Provider>{children}</useThanosContext.Provider>
          </useAccountContext.Provider>
        </useThanosSDKContext.Provider>
      </useNetworkContext.Provider>
    </useConseilJSContext.Provider>
  );
};

export default ContextProvider;
