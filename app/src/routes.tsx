import { HashRouter, Route, Switch } from "react-router-dom";
import React from "react";
import GovernanceProvider from "./contexts/GovernanceContext";
import { AllRealmsView } from "./views";
import { OysterProposalView } from "./views/proposal/oysterProposalView";
import { GovernanceView } from "./views/governance/governanceView";
import { DevToolsView } from "./views/devtools/DevToolsView";
import { RealmView } from "./views/realm/realmView";

import { ErrorBoundary } from "react-error-boundary";

import { AppErrorBanner } from "./components/appErrorBanner/appErrorBanner";
import { HomeView } from "./views/Home";
import { FlightLogView } from "./views/FlightLogs";
import { AirdropView } from "./views/Airdrop";
import { AirdropHistory } from "./views/AirdropHistory";
import { InitModalProvider } from "./contexts/initModal";
import { ProposalView } from "./views/Proposal";
import { DarkThemeProvider } from "./contexts/darkTheme";
import { ConnectWalletProvider } from "./contexts/connectWallet";
import { AirdropProvider } from "./contexts/airdrop";
import { AppLayout } from "./components/Layout";
import {
  AccountsProvider,
  ConnectionProvider,
  WalletProvider,
} from "./contexts";
import { ScrollToTop } from "./contexts/scrollToTop";

export function Routes() {
  return (
    <>
      <HashRouter basename={"/"}>
        {/* TODO: Adding the error boundary as a quick fix to avoid black screens
        for crashes However we should make it nicer and hide the technical
        details from users by default */}
        <ErrorBoundary FallbackComponent={AppErrorBanner}>
          <DarkThemeProvider>
            <ConnectionProvider>
              <WalletProvider>
                <ConnectWalletProvider>
                  <InitModalProvider>
                    <AirdropProvider>
                      <AccountsProvider>
                        <GovernanceProvider>
                          <AppLayout>
                            <Switch>
                              <ScrollToTop>
                                <Route exact path="/" children={<HomeView />} />
                                <Route
                                  path={"/proposal/:key"}
                                  children={<ProposalView />}
                                />
                                <Route
                                  exact
                                  path="/claims"
                                  children={<AirdropView />}
                                />
                                {/* <Route 
                              exact path="/airdrop/history"
                              children={<AirdropHistory />}/> */}
                                <Route
                                  exact
                                  path="/flight-logs"
                                  children={<FlightLogView />}
                                />

                                {/** Old oyster paths */}
                                <Route
                                  exact
                                  path="/realms"
                                  component={() => <AllRealmsView />}
                                />
                                <Route
                                  path="/proposal-oyster/:key"
                                  children={<OysterProposalView />}
                                />
                                <Route
                                  path="/governance/:key"
                                  children={<GovernanceView />}
                                />
                                <Route
                                  path="/realm/:key"
                                  children={<RealmView />}
                                />
                                <Route
                                  exact
                                  path="/devtools"
                                  children={<DevToolsView />}
                                />
                              </ScrollToTop>
                            </Switch>
                          </AppLayout>
                        </GovernanceProvider>
                      </AccountsProvider>
                    </AirdropProvider>
                  </InitModalProvider>
                </ConnectWalletProvider>
              </WalletProvider>
            </ConnectionProvider>
          </DarkThemeProvider>
        </ErrorBoundary>
      </HashRouter>
    </>
  );
}
