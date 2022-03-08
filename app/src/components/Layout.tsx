import React from "react";
import "../App.less";
import { Layout } from "antd";
import { Nav } from "./Nav";

const { Content } = Layout;

export const AppLayout = React.memo(({ children }) => {
  return (
    <div className="App">
      <Layout>
        <Nav />
        <Content>{children}</Content>
      </Layout>
    </div>
  );
});
