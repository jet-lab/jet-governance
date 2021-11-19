import { HashRouter, Route, Switch } from "react-router-dom";
import React, { useMemo, useState, useEffect } from "react";
import { WalletProvider } from "@solana/wallet-adapter-react";
import { ProposalProvider } from "./contexts/proposal";
import { ConnectionProvider } from "./contexts/connection";
import { AccountsProvider } from "./contexts/accounts";
import { AppLayout } from "./components/Layout";

import { INITIAL_STATE } from "./models/INITIAL_PROPOSALS";

import { FaucetView, HomeView, ProposalView } from "./views";
import {
  getLedgerWallet,
  getMathWallet,
  getPhantomWallet,
  getSolflareWallet,
  getSolletWallet,
  getSolongWallet,
  getTorusWallet,
} from "@solana/wallet-adapter-wallets";

export function Routes() {
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
  
  const allProposals = INITIAL_STATE;
  const activeProposals = INITIAL_STATE.filter((p) => p.active);
  const inactiveProposals = INITIAL_STATE.filter((p) => !p.active && p.result === "inactive");
  const passedProposals = INITIAL_STATE.filter((p) => !p.active && p.result === "passed");
  const rejectedProposals = INITIAL_STATE.filter((p) => !p.active && p.result === "rejected");

  
  return (
    <HashRouter basename={"/"}>
      <ConnectionProvider>
        <WalletProvider wallets={wallets} autoConnect>
          <AccountsProvider>
            <ProposalProvider>
              <AppLayout>
                <Switch>
                  <Route exact path="/">
                    <HomeView
                      allProposals={allProposals}
                      activeProposals={activeProposals}
                      inactiveProposals={inactiveProposals}
                      passedProposals={passedProposals}
                      rejectedProposals={rejectedProposals} />
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
                            shownProposals={activeProposals}
                          />
                        </Route>
                      ))}
                </Switch>
              </AppLayout>
            </ProposalProvider>
          </AccountsProvider>
        </WalletProvider>
      </ConnectionProvider>
    </HashRouter>
  );
}
