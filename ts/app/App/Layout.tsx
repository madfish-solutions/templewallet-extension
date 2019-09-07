import * as React from "react";
import Header from "./Layout/Header";
import Content from "./Layout/Content";

interface LayoutProps {
  popup?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children }) => (
  <>
    <Header />
    <Content>{children}</Content>
  </>
);

export default Layout;
