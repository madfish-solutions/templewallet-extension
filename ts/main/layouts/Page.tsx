import * as React from "react";
import Header from "./Page/Header";

const PageLayout: React.FC = ({ children }) => (
  <>
    <Header />
    <main>{children}</main>
  </>
);

export default PageLayout;
