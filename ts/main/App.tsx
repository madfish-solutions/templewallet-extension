import * as React from "react";
import WidthContainer from "main/layouts/WidthContainer";
import useConseilJSContext from "lib/useConseilJSContext";
import useThanos from "lib/useThanos";

const App: React.FC = () => {
  return (
    <useConseilJSContext.Provider>
      <WidthContainer>
        <div>KEK LAL plS</div>
        <ConseilJSCheck />
      </WidthContainer>
    </useConseilJSContext.Provider>
  );
};

export default App;

const ConseilJSCheck: React.FC = () => {
  const thanos = useThanos();

  if (thanos.conseilJsLoaded) {
    (window as any)["thanos"] = thanos;
    return <div>Thanos has come.</div>;
  }

  return null;
};
