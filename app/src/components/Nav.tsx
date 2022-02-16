import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnectWallet } from "../contexts/connectWallet";
import { useDarkTheme } from "../contexts/darkTheme";
import { Button, Switch } from "antd";
import { useAirdrop } from "../contexts/airdrop";
import { shortenAddress } from "../utils";
import User from '../images/user.svg'
import { ReactComponent as Wallet } from '../images/wallet.svg'

export function Nav() {
  const { pathname } = useLocation();
  const { connected, disconnect, publicKey } = useWallet();
  const { setConnecting, resetAuth } = useConnectWallet();
  const [drawerOpened, setDrawerOpened] = useState(false);
  const { unclaimedAirdrops } = useAirdrop();
  const { darkTheme, toggleDarkTheme } = useDarkTheme();

  const navLinks = [
    { title: "Your Info", route: "/your-info", mobileOnly: true },
    { title: "Dashboard", route: "/", mobileOnly: false },
    {
      title: `Claims`,
      class: "shimmer",
      badge: unclaimedAirdrops(),
      route: "/claims", mobileOnly: false 
    },
    { title: "Flight Logs", route: "/flight-logs", mobileOnly: false  },
  ];

  const mobileFooterLinks = [
    { title: "Terms of Use", url: "/flight-logs" },
    { title: "Privacy Policy", url: "" },
  ];

  const accountLink = { title: "Account", route: "/account" };

  const disconnectAndResetAuth = () => {
    disconnect();
    resetAuth();
  };

  // Handle swiping of nav drawer
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);
  window.addEventListener("touchstart", (e) => {
    setTouchStartX(e.changedTouches[0].screenX);
  });
  window.addEventListener("touchend", (e) => {
    setTouchEndX(e.changedTouches[0].screenX);
    handleSwipe();
  });

  const handleSwipe = () => {
    // Open drawer
    if (!drawerOpened && touchEndX < touchStartX - 75) {
      setDrawerOpened(true);
    }

    // Close drawer
    if (drawerOpened && touchEndX > touchStartX + 75) {
      setDrawerOpened(false);
    }
  };

  return (
    <div
      className={`navbar-container flex-centered ${
        drawerOpened ? "drawer-open" : ""
      }`}
    >
      {/* Desktop Nav */}
      <nav className="desktop flex align-center justify-between">
        <Link to="/" className="left-container-logo flex-centered">
          <img
            src="img/jetgovern_white.png"
            width="100%"
            height="auto"
            alt="Jet Protocol"
          />
        </Link>
        <div className="nav-links flex-centered">
          {navLinks.map((link) => !link.mobileOnly && (
            <Link
            to={link.route}
            className={`nav-link ${pathname === link.route ? "active" : ""} ${
              link.class
            }`}
            key={link.route}
          >
            {link.title}
            {link.badge ? (
              <span className="badge">
                <span className="text-gradient">{link.badge}</span>
              </span>
            ) : (
              ""
            )}
          </Link>
          ))}
          <Button
            className="secondary-btn flex-centered"
            type="ghost"
            title={connected ? "disconnect" : "connect"}
            onClick={() =>
              connected ? disconnectAndResetAuth() : setConnecting(true)
            }
          >
            {connected
              ? `${shortenAddress(
                  publicKey ? publicKey.toString() : ""
                )} CONNECTED`
              : "CONNECT WALLET"}
          </Button>
        </div>
      </nav>

      {/* Mobile Nav */}
      <nav className="mobile flex align-center justify-between">
        <Link className="account" to={accountLink.route}>
          <img
            width="25px"
            src={User}
            alt={accountLink.title}
          />
        </Link>
        
        <div
          className={`hamburger flex align-center justify-between column ${
            drawerOpened ? "close" : ""
          }`}
          onClick={() => setDrawerOpened(!drawerOpened)}
        >
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div className="drawer flex align-center justify-between column">
          <div className="drawer-top flex-centered column">
            {navLinks.map((link) => (
              <Link
                key={link.title}
                to={link.route}
                className={`nav-link ${
                  pathname === link.route ? "active" : ""
                }`}
                onClick={() => setDrawerOpened(false)}
              >
                {link.title}
              </Link>
            ))}
            <Button
              ghost
              className="flex-centered small-btn"
              style={{ textTransform: "unset" }}
              title={connected ? "Disconnect" : "Connect"}
              onClick={() => {
                if (connected) {
                  disconnect();
                } else {
                  setConnecting(true);
                  setDrawerOpened(false);
                }
              }}
            >
              <Wallet width="15px"/>
              {connected
                ? `${shortenAddress(
                    publicKey ? publicKey.toString() : ""
                  )} CONNECTED`
                : "CONNECT"}
            </Button>
          </div>
          <div className="drawer-bottom flex-centered column">
            {mobileFooterLinks.map((link) => (
              <a
                key={link.title}
                href={link.url}
                className="footer-link"
                rel="noopener noreferrer"
                target="_blank"
              >
                {link.title}
              </a>
            ))}
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
