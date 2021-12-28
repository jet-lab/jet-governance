import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnectWallet } from "../contexts/connectWallet";
import { Button, Switch } from "antd";
import { useDarkTheme } from "../contexts/darkTheme";
import { useAirdrop } from "../contexts/airdrop";
import { shortenAddress } from "../utils";


export function Nav() {
  const { pathname } = useLocation();
  const { connected, disconnect, publicKey } = useWallet();
  const { setConnecting } = useConnectWallet();
  const { toggleDarkTheme } = useDarkTheme();
  const [drawerOpened, setDrawerOpened] = useState(false);
  const { unclaimedAirdrops } = useAirdrop(); 

  //const unclaimedBadge = (<div>{}</div>)

  const navLinks = [
    {title: 'Voting', route: '/'},
    {title: `Airdrop`, badge: unclaimedAirdrops(), route: '/airdrop'},
    {title: 'Flight log', route: '/flight-log'}
  ];

  return (
    <div className="navbar-container flex-centered column">
      <nav className="flex align-center justify-between">
        <div className="left-container flex-centered">
          <div className={`left-container-hamburger flex align-center justify-between column
            ${drawerOpened ? 'close' : ''}`}
            onClick={() => setDrawerOpened(!drawerOpened)}>
            <span></span>
            <span></span>
            <span></span>
          </div>
          <a className="left-container-logo flex-centered" 
            href="/" target="_blank" rel="noopener noreferrer">
            <img src="img/jetgovern_white.png" 
              width="100%"
              height="auto"
              alt="Jet Protocol" 
            />
          </a>
        </div>
        <div className="right-container flex-centered">
          <Switch onChange={() => toggleDarkTheme()} />
          {navLinks.map((link) =>
            <Link
              to={link.route}
              className={`nav-link ${pathname === link.route ? 'active' : ''}`}
              key={link.route}
            >
              {link.title} {link.badge ? (<span className="badge">{link.badge}</span>) : ""}
            </Link>
          )}
          <Button className="secondary-btn flex-centered"
            type="ghost"
            title={connected ? "disconnect" : "CONNECT"}
            onClick={() => connected ? disconnect() : setConnecting(true)}>
            {connected 
              ? `${shortenAddress(publicKey ? publicKey.toString() : '')} CONNECTED` 
                : "CONNECT"}
          </Button>
        </div>
      </nav>
      <div className={`navbar-container-drawer flex align-end column ${drawerOpened ? 'open' : ''}`}>
        {navLinks.map((link) =>
          <Link
            to={link.route}
            className={`nav-link ${pathname === link.route ? 'active' : ''}`}
            key={link.route}
          >
            {link.title}
          </Link>
        )}
      </div>
    </div>
  );
};
