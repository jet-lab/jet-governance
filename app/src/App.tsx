import "./App.less";
import { HashRouter, Route, Switch } from "react-router-dom";
import { useMemo, useState } from "react";
import { WalletProvider } from "@solana/wallet-adapter-react";
import { ProposalProvider, useProposal } from "./contexts/proposal";
import { ConnectionProvider } from "./contexts/connection";
import { AccountsProvider } from "./contexts/accounts";
import { ConnectWalletProvider } from "./contexts/connectWallet";
import { AirdropProvider } from "./contexts/airdrop";
import { DarkThemeProvider } from "./contexts/darkTheme";
import { AppLayout } from "./components/Layout";
import { ScrollToTop } from "./contexts/scrollToTop";
import { AirdropView, FlightLogView } from "./views";
import { HomeView, ProposalView } from "./views";
import {
  getMathWallet,
  getPhantomWallet,
  getSolflareWallet,
  getSolletWallet,
  getSolongWallet,
} from "@solana/wallet-adapter-wallets";
import "./App.less";
import "./DarkTheme.less";

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

  // If IP address is in US, geoban
  // TODO: try catch
  // useEffect(() => {
  //   getGeobanned();
  // });

  return (
    <HashRouter basename={"/"}>
      <DarkThemeProvider>
        <ConnectionProvider>
          <WalletProvider wallets={wallets} autoConnect>
            <ConnectWalletProvider>
              <AirdropProvider>
                <AccountsProvider>
                  <ProposalProvider>
                    <AppLayout>
                      <ScrollToTop>
                        <Switch>
                          <Route exact path="/">
                            <HomeView />
                          </Route>
                          <Route exact path="/airdrop">
                            <AirdropView />
                          </Route>
                          <Route exact path="/flight-log">
                            <FlightLogView />
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
                                  <ProposalView id={proposal.id} />
                                </Route>
                              ))}
                        </Switch>
                      </ScrollToTop>
                    </AppLayout>
                  </ProposalProvider>
                </AccountsProvider>
              </AirdropProvider>
            </ConnectWalletProvider>
          </WalletProvider>
        </ConnectionProvider>
      </DarkThemeProvider>
    </HashRouter>
  );
}

export default App;
