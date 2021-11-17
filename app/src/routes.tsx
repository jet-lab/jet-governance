import { HashRouter, Route, Switch } from "react-router-dom";
import React, { useMemo } from "react";
import { WalletProvider } from "@solana/wallet-adapter-react";
import { ConnectionProvider } from "./contexts/connection";
import { AccountsProvider } from "./contexts/accounts";
import { MarketProvider } from "./contexts/market";
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

  return (
    <HashRouter basename={"/"}>
      <ConnectionProvider>
        <WalletProvider wallets={wallets} autoConnect>
          <AccountsProvider>
            <MarketProvider>
              <AppLayout>
                <Switch>
                  <Route exact path="/">
                    <HomeView proposals={INITIAL_STATE} />
                  </Route>
                  {/* <Route exact path="/faucet">
                    <FaucetView />
                  </Route> */}
                  {INITIAL_STATE.map((proposal) => <Route exact path={`/proposal/${proposal.id}/${proposal.headline.substring(0,7)}`}>
                    <ProposalView
                      id={proposal.id}
                      result={proposal.result}
                      headline={proposal.headline}
                      active={proposal.active}
                      end={proposal.end}
                      hash={proposal.hash}
                    />
                  </Route>)}
                </Switch>
              </AppLayout>
            </MarketProvider>
          </AccountsProvider>
        </WalletProvider>
      </ConnectionProvider>
    </HashRouter>
  );
}
