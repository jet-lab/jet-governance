import "../App.less";
import { Layout } from "antd";
import React from "react";
import { Navbar } from "./Navbar";
import { TermsPrivacy } from "./TermsPrivacy";

const { Content } = Layout;

export const AppLayout = React.memo(({ children }) => {
  return (
    <div className="App">
      <Layout>
        <Navbar />
        <Content>{children}</Content>
        <TermsPrivacy />
      </Layout>
    </div>
  );
});
