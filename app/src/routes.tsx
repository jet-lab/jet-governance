import { HashRouter, Route, Switch } from "react-router-dom";
import GovernanceProvider from "./contexts/GovernanceContext";

import { ErrorBoundary } from "react-error-boundary";
import { QueryClient, QueryClientProvider } from "react-query";
import { AppErrorBanner } from "./components/appErrorBanner/appErrorBanner";
import { HomeView } from "./views/Home";
import { FlightLogView } from "./views/FlightLogs";
import { AirdropView } from "./views/Airdrop";
import { ProposalView } from "./views/Proposal";
import { Settings } from "./views/Settings";
import { YourInfo } from "./components/YourInfo";
import { MobileMessage } from "./components/MobileMessage";
import { DarkThemeProvider } from "./contexts/darkTheme";
import { ConnectWalletProvider } from "./contexts/connectWallet";
import { TransactionsProvider } from "./contexts/transactionLogs";
import { AppLayout } from "./components/Layout";
import { ConnectionProvider, WalletProvider } from "./contexts";
import { ScrollToTop } from "./contexts/scrollToTop";
import { ProposalProvider } from "./contexts/proposal";
import { ConfigProvider } from "antd-country-phone-input";
import en from "world_countries_lists/data/en/world.json";
import { BlockExplorerProvider } from "./contexts/blockExplorer";

const queryClient = new QueryClient();

export function Routes() {
  return (
    <HashRouter basename={"/"}>
      {/* TODO: Adding the error boundary as a quick fix to avoid black screens
      for crashes However we should make it nicer and hide the technical
      details from users by default */}
      <ErrorBoundary FallbackComponent={AppErrorBanner}>
        <QueryClientProvider client={queryClient}>
          <DarkThemeProvider>
            <ConnectionProvider>
              <BlockExplorerProvider>
                <GovernanceProvider>
                  <WalletProvider>
                    <ConfigProvider locale={en}>
                      <ConnectWalletProvider>
                        <ProposalProvider>
                          <TransactionsProvider>
                            <AppLayout>
                              <Switch>
                                <ScrollToTop>
                                  <Route exact path="/" children={<HomeView />} />
                                  <Route exact path="/your-info" children={<YourInfo />} />
                                  <Route path={"/proposal/:key"} children={<ProposalView />} />
                                  <Route exact path="/claims" children={<AirdropView />} />
                                  <Route exact path="/flight-logs" children={<FlightLogView />} />
                                  <Route exact path="/settings" children={<Settings />} />
                                  <MobileMessage />
                                </ScrollToTop>
                              </Switch>
                            </AppLayout>
                          </TransactionsProvider>
                        </ProposalProvider>
                      </ConnectWalletProvider>
                    </ConfigProvider>
                  </WalletProvider>
                </GovernanceProvider>
              </BlockExplorerProvider>
            </ConnectionProvider>
          </DarkThemeProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </HashRouter>
  );
}
