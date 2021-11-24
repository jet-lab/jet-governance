import "./App.less";
import { HashRouter, Route, Switch } from "react-router-dom";
import React, { useMemo, useState, useEffect } from "react";
import { WalletProvider } from "@solana/wallet-adapter-react";
import { ProposalProvider } from "./contexts/proposal";
import { ConnectionProvider } from "./contexts/connection";
import { AccountsProvider } from "./contexts/accounts";
import { ConnectWalletProvider } from "./contexts/connectWallet";
import { AppLayout } from "./components/Layout";

import { INITIAL_STATE } from "./models/INITIAL_PROPOSALS";

import { HomeView, ProposalView } from "./views";
import {
  getLedgerWallet,
  getMathWallet,
  getPhantomWallet,
  getSolflareWallet,
  getSolletWallet,
  getSolongWallet,
  getTorusWallet,
} from "@solana/wallet-adapter-wallets";

function App() {
  const [geobanned, setGeobanned] = useState(false);

  const wallets = useMemo(
    () => [
      getPhantomWallet(),
      getSolflareWallet(),
      getTorusWallet({
        options: {
          // TODO: Get your own tor.us wallet client Id
          clientId:
            "BOM5Cl7PXgE9Ylq1Z1tqzhpydY0RVr8k90QQ85N7AKI5QGSrr9iDC-3rvmy0K_hF0JfpLMiXoDhta68JwcxS1LQ",
        },
      }),
      getLedgerWallet(),
      getSolongWallet(),
      getMathWallet(),
      getSolletWallet(),
    ],
    []
  );

  // If IP address is in US, geoban
  // useEffect(() => {
  //   const getGeobanned = async () => {
  //     const resp = await fetch("https://ipinfo.io/json?token=46ceefa5641a93", {
  //       method: "GET",
  //       headers: { "Content-Type": "application/json" },
  //     });
  //     let locale = await resp.json();
  //     if (locale?.country === "US") {
  //       setGeobanned(true);
  //     }
  //   };
  //   getGeobanned();
  // });

  return (
    <HashRouter basename={"/"}>
      <ConnectionProvider>
        <WalletProvider wallets={wallets} autoConnect>
          <ConnectWalletProvider>
            <AccountsProvider>
              <ProposalProvider>
                <AppLayout>
                  <Switch>
                    <Route exact path="/">
                      <HomeView />
                    </Route>
                    {geobanned
                      ? null
                      : INITIAL_STATE.map((proposal) => (
                          <Route
                            exact
                            path={`/proposal/${
                              proposal.id
                            }/${proposal.headline.substring(0, 7)}`}
                          >
                            <ProposalView
                              id={proposal.id}
                              result={proposal.result}
                              headline={proposal.headline}
                              active={proposal.active}
                              end={proposal.end}
                              hash={proposal.hash}
                            />
                          </Route>
                        ))}
                  </Switch>
                </AppLayout>
              </ProposalProvider>
            </AccountsProvider>
          </ConnectWalletProvider>
        </WalletProvider>
      </ConnectionProvider>
    </HashRouter>
  );
}

export default App;
