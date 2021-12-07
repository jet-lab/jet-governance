import React from "react";
import "../App.less";
import { Layout, Switch, Menu } from "antd";
import Logo from "../images/jetgovern_white.png";
import { WalletModalProvider } from "@solana/wallet-adapter-ant-design";
import { ConnectModal } from "./ConnectModal";
import { ConnectButton } from "./ConnectButton";
import { Link } from "react-router-dom";

const { Header, Content } = Layout;

export const AppLayout = React.memo(({ children }) => {
  return (
    <WalletModalProvider>
      <div className="App">
        <Layout>
          <Header className="nav">
            <div className="navbar-container">
              <a href="/">
                <img src={Logo} alt="logo" id="nav-header" />
              </a>
              <div className="flex-centered">
                <Link to="/" className="nav-link">
                  Voting
                </Link>
                <Link to="/airdrop" className="nav-link">
                  Airdrop 
                </Link>
                <Link to="/flight-log" className="nav-link">
                  Flight log
                </Link>
                <ConnectButton />
                <ConnectModal />
              </div>
            </div>
          </Header>
          <Content>{children}</Content>
        </Layout>
      </div>
    </WalletModalProvider>
  );
});
