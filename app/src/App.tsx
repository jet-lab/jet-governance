import "./App.less";
import { HashRouter, Route, Switch } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import { WalletProvider } from "@solana/wallet-adapter-react";
import { ProposalProvider, useProposal } from "./contexts/proposal";
import { ConnectionProvider } from "./contexts/connection";
import { AccountsProvider } from "./contexts/accounts";
import { ConnectWalletProvider } from "./contexts/connectWallet";
import { AppLayout } from "./components/Layout";
import { ClaimView } from "./views";

import { HomeView, ProposalView } from "./views";
import {
  getMathWallet,
  getPhantomWallet,
  getSolflareWallet,
  getSolletWallet,
  getSolongWallet,
} from "@solana/wallet-adapter-wallets";

function App() {
  const [geobanned, setGeobanned] = useState(false);
  const { allProposals } = useProposal();

  const wallets = useMemo(
    () => [
      getPhantomWallet(),
      getSolflareWallet(),
      getSolongWallet(),
      getMathWallet(),
      getSolletWallet(),
    ],
    []
  );

  // If IP address is in US, geoban
  // TODO: try catch
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
                    <Route exact path="/claim">
                      <ClaimView />
                    </Route>
                    {geobanned
                      ? null
                      : allProposals.map((proposal) => (
                          <Route
                            exact
                            path={`/proposal/${
                              proposal.id
                            }/${proposal.headline.substring(0, 7)}`}
                          >
                          <ProposalView
                              description={proposal.description}
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
