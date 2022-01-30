import { HashRouter, Route, Switch } from "react-router-dom";
import GovernanceProvider from "./contexts/GovernanceContext";

import { ErrorBoundary } from "react-error-boundary";

import { AppErrorBanner } from "./components/appErrorBanner/appErrorBanner";
import { HomeView } from "./views/Home";
import { FlightLogView } from "./views/FlightLogs";
import { AirdropView } from "./views/Airdrop";
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
import { ProposalProvider } from "./contexts/proposal";
import { ConfigProvider } from "antd-country-phone-input";
import en from 'world_countries_lists/data/en/world.json';

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
                <ConfigProvider locale={en}>
                <ConnectWalletProvider>
                    <AirdropProvider>
                      <AccountsProvider>
                        <GovernanceProvider>
                          <ProposalProvider>
                            <AppLayout>
                              <Switch>
                                <ScrollToTop>
                                  <Route
                                    exact path="/"
                                    children={<HomeView />}
                                  />
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
                                  {/* <Route
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
                                  /> */}
                                </ScrollToTop>
                              </Switch>
                            </AppLayout>
                          </ProposalProvider>
                        </GovernanceProvider>
                      </AccountsProvider>
                    </AirdropProvider>
                  </ConnectWalletProvider>
                  </ConfigProvider>
              </WalletProvider>
            </ConnectionProvider>
          </DarkThemeProvider>
        </ErrorBoundary>
      </HashRouter>
    </>
  );
}
