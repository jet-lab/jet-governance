import { ConfigProvider } from "antd-country-phone-input";
import en from "world_countries_lists/data/en/world.json";
import { ErrorBoundary } from "react-error-boundary";
import { QueryClient, QueryClientProvider } from "react-query";
import { HashRouter, Route, Switch } from "react-router-dom";
import { AppErrorBanner, AppLayout, MobileMessage, YourInfo } from "./components";
import {
  BlockExplorerProvider,
  ConnectionProvider,
  ConnectWalletProvider,
  DarkThemeProvider,
  GovernanceProvider,
  ProposalProvider,
  ScrollToTop,
  TransactionsProvider,
  WalletProvider
} from "./contexts";
import { geoBannedCountriesArr } from "./utils";
import { AirdropView, FlightLogView, HomeView, ProposalView, SettingsView } from "./views";
import { RpcNodeContextProvider } from "./contexts/rpcNode";

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
                    <ConfigProvider
                      locale={en}
                      areaFilter={area => !geoBannedCountriesArr.includes(area.name!)}
                    >
                      <ConnectWalletProvider>
                        <RpcNodeContextProvider>
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
                                    <Route exact path="/settings" children={<SettingsView />} />
                                    <MobileMessage />
                                  </ScrollToTop>
                                </Switch>
                              </AppLayout>
                            </TransactionsProvider>
                          </ProposalProvider>
                        </RpcNodeContextProvider>
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
