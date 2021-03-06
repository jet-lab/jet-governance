import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnectWallet, useDarkTheme, useProposalContext } from "../contexts";
import { Button, Switch } from "antd";
import { shortenAddress } from "../utils";
import { ReactComponent as AccountIcon } from "../images/account_icon.svg";
import { ReactComponent as WalletIcon } from "../images/wallet_icon.svg";
import { DocsLink } from "./docsLink";

export function Navbar() {
  const { pathname } = useLocation();
  const { connected, disconnect, publicKey } = useWallet();
  const { setConnecting } = useConnectWallet();
  const [drawerOpened, setDrawerOpened] = useState(false);
  const { claimsCount } = useProposalContext();
  const { darkTheme, toggleDarkTheme } = useDarkTheme();

  const navLinks = [
    { title: "Dashboard", route: "/" },
    {
      title: `Claims`,
      class: claimsCount > 0 ? "shimmer" : "",
      badge: claimsCount > 0 ? claimsCount : "",
      route: "/claims"
    },
    {
      title: "Flight Logs",
      route: "/flight-logs"
    },
    {
      title: "Settings",
      route: "/settings"
    }
  ];
  const mobileFooterLinks = [
    {
      title: "Terms of Service",
      route: "/"
    },
    {
      title: "Glossary",
      url: "https://jet-association.gitbook.io/jet-association-1.0.0/terms-and-definitions"
    }
  ];
  const accountLink = { title: "Account", route: "/your-info" };

  return (
    <div className={`navbar-container flex-centered ${drawerOpened ? "drawer-open" : ""}`}>
      {/* Desktop Nav */}
      <nav className="desktop flex align-center justify-between">
        <Link className="logo flex-centered" to="/">
          <img src="img/jet/jet_govern_white.png" width="90%" height="auto" alt="Jet Protocol" />
        </Link>
        <div className="nav-links flex-centered">
          {navLinks.map(link => (
            <>
              <Link
                to={link.route}
                className={`nav-link ${pathname === link.route ? "active" : ""} ${link.class}`}
                style={link.badge ? { marginRight: 0 } : {}}
                key={link.route}
              >
                {link.title}
              </Link>
              {link.badge ? (
                <span className="badge">
                  <span className="gradient-text">{link.badge}</span>
                </span>
              ) : (
                ""
              )}
            </>
          ))}
          <Button
            ghost
            className="flex-centered"
            style={{ textTransform: "unset" }}
            title={connected ? "Disconnect Wallet" : "Connect Wallet"}
            onClick={() => (connected ? disconnect() : setConnecting(true))}
          >
            <WalletIcon width="20px" />
            {connected
              ? `${shortenAddress(publicKey ? publicKey.toString() : "")} CONNECTED`
              : "CONNECT"}
          </Button>
        </div>
      </nav>
      {/* Mobile Nav */}
      <nav className="mobile flex align-center justify-between">
        <Link className="account" to={accountLink.route}>
          <AccountIcon width="25px" />
        </Link>
        <Link className="logo flex-centered" to="/">
          <img
            className="logo"
            src="img/jet/jet_govern_white.png"
            width="90%"
            height="auto"
            alt="JetGovern"
          />
        </Link>
        <div
          className={`hamburger flex align-center justify-between column ${
            drawerOpened ? "close" : ""
          }`}
          onClick={() => {
            setDrawerOpened(!drawerOpened);
          }}
        >
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div className="drawer flex align-center justify-between column">
          <div className="drawer-top flex-centered column">
            {navLinks.map(link => (
              <Link
                key={link.title}
                to={link.route}
                className={`nav-link ${pathname === link.route ? "active" : ""}`}
                onClick={() => setDrawerOpened(false)}
              >
                {link.title}
              </Link>
            ))}
            <Button
              ghost
              className="flex-centered small-btn"
              style={{ textTransform: "unset" }}
              title={connected ? "Disconnect Wallet" : "Connect Wallet"}
              onClick={() => {
                if (connected) {
                  disconnect();
                } else {
                  setConnecting(true);
                  setDrawerOpened(false);
                }
              }}
            >
              <WalletIcon width="20px" />
              {connected
                ? `${shortenAddress(publicKey ? publicKey.toString() : "")} CONNECTED`
                : "CONNECT"}
            </Button>
          </div>
          <div className="drawer-bottom flex-centered column">
            {mobileFooterLinks.map(link => (
              <a
                key={link.title}
                href={link.url}
                className="footer-link footer-link-pad"
                rel="noopener noreferrer"
                target="_blank"
              >
                {link.title}
              </a>
            ))}
            <DocsLink className="footer-link footer-link-pad" noGradient>
              Docs
            </DocsLink>
            <Switch
              className="secondary-switch"
              onClick={() => toggleDarkTheme()}
              checked={darkTheme}
              checkedChildren="Dark"
              unCheckedChildren="Light"
            />
          </div>
        </div>
      </nav>
    </div>
  );
}
