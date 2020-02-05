import * as React from "react";
import Header from "./PageLayout/Header";
import Content from "./PageLayout/Content";

const Layout: React.FC = ({ children }) => (
  <>
    <Header />
    <Content>{children}</Content>
  </>
);

export default Layout;
