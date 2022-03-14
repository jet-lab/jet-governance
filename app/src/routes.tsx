import { HashRouter, Route, Switch } from "react-router-dom";
import GovernanceProvider from "./contexts/GovernanceContext";

import { ErrorBoundary } from "react-error-boundary";

import { AppErrorBanner } from "./components/appErrorBanner/appErrorBanner";
import { HomeView } from "./views/Home";
import { FlightLogView } from "./views/FlightLogs";
import { AirdropView } from "./views/Airdrop";
import { ProposalView } from "./views/Proposal";
import { YourInfo } from "./components/YourInfo";
import { DarkThemeProvider } from "./contexts/darkTheme";
import { ConnectWalletProvider } from "./contexts/connectWallet";
import { AirdropProvider } from "./contexts/airdrop";
import { TransactionsProvider } from "./contexts/transactionLogs";
import { AppLayout } from "./components/Layout";
import { ConnectionProvider, WalletProvider } from "./contexts";
import { ScrollToTop } from "./contexts/scrollToTop";
import { ProposalProvider } from "./contexts/proposal";
import { ConfigProvider } from "antd-country-phone-input";
import en from "world_countries_lists/data/en/world.json";
import { GlossaryView } from "./views/Glossary";
import { TermsView } from "./views/TermsConditions";
import { QueryClient, QueryClientProvider } from "react-query";

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
              <GovernanceProvider>
                <WalletProvider>
                  <ConfigProvider locale={en}>
                    <ConnectWalletProvider>
                      <AirdropProvider>
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
                                  <Route exact path="/glossary" children={<GlossaryView />} />
                                  <Route exact path="/terms" children={<TermsView />} />
                                </ScrollToTop>
                              </Switch>
                            </AppLayout>
                          </TransactionsProvider>
                        </ProposalProvider>
                      </AirdropProvider>
                    </ConnectWalletProvider>
                  </ConfigProvider>
                </WalletProvider>
              </GovernanceProvider>
            </ConnectionProvider>
          </DarkThemeProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </HashRouter>
  );
}
