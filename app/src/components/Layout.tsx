import React from "react";
import "../App.less";
import { Layout, Switch } from "antd";
import Logo from "../images/jetgovern_white.png";
import { WalletModalProvider } from "@solana/wallet-adapter-ant-design";
import { ConnectModal } from "./ConnectModal";
import { ConnectButton } from "./ConnectButton";

const { Header, Content } = Layout;

export const AppLayout = React.memo(({ children }) => {


  return (
    <WalletModalProvider>
      <div className="App">
      <Layout>
        <Header className="nav-bar">
            <img src={Logo} alt="logo" id="nav-header" />
            <Switch checkedChildren="dark" unCheckedChildren="light" />
            <ConnectButton />
            <ConnectModal />
          </Header>
          <Content>
          {children}
        </Content>
    </Layout>
      </div>
    </WalletModalProvider>
  );
});
