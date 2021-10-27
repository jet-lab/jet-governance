import React, { useState } from "react";
import "./../../App.less";
import { Layout } from "antd";
import Logo from "../../images/jetgovern_white.png";
import { Link, useLocation } from "react-router-dom";
import { WalletModalProvider } from "@solana/wallet-adapter-ant-design";

import { NavLink } from "../Icons/navLink";
import { LABELS } from "../../constants";
import { AppBar } from "../AppBar";

const { Header, Content } = Layout;

export const AppLayout = React.memo(({ children }) => {
  const location = useLocation();

  return (
    <WalletModalProvider>
      <div className="App wormhole-bg">
      <Layout title={LABELS.APP_TITLE}>
          <Header className="nav-bar">
          <img src={Logo} alt="logo" />
            <AppBar />
          </Header>
          <Content>{children}</Content>
        </Layout>
      </div>
    </WalletModalProvider>
  );
});
