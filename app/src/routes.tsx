import { HashRouter, Route, Switch } from 'react-router-dom';
import GovernanceProvider from './contexts/GovernanceContext';

import { ErrorBoundary } from 'react-error-boundary';

import { AppErrorBanner } from './components/appErrorBanner/appErrorBanner';
import { HomeView } from './views/Home';
import { FlightLogView } from './views/FlightLogs';
import { AirdropView } from './views/Airdrop';
import { ProposalView } from './views/Proposal';
import { YourInfo } from './components/YourInfo';
import { DarkThemeProvider } from './contexts/darkTheme';
import { ConnectWalletProvider } from './contexts/connectWallet';
import { AirdropProvider } from './contexts/airdrop';
import { AppLayout } from './components/Layout';
import { AccountsProvider, ConnectionProvider, WalletProvider } from './contexts';
import { ScrollToTop } from './contexts/scrollToTop';
import { ProposalProvider } from './contexts/proposal';
import { AirdropHistory } from './views/AirdropHistory';
import { ConfigProvider } from 'antd-country-phone-input';
import en from 'world_countries_lists/data/en/world.json';
import { GlossaryView } from './views/Glossary';
import { TermsView } from './views/TermsConditions';

export function Routes() {
  return (
    <HashRouter basename={'/'}>
      {/* TODO: Adding the error boundary as a quick fix to avoid black screens
      for crashes However we should make it nicer and hide the technical
      details from users by default */}
      <ErrorBoundary FallbackComponent={AppErrorBanner}>
        <DarkThemeProvider>
          <ConnectionProvider>
            <GovernanceProvider>
              <WalletProvider>
                <ConfigProvider locale={en}>
                  <ConnectWalletProvider>
                    <AirdropProvider>
                      <AccountsProvider>
                        <ProposalProvider>
                          <AppLayout>
                            <Switch>
                              <ScrollToTop>
                                <Route exact path="/" children={<HomeView />} />
                                <Route exact path="/your-info" children={<YourInfo />} />
                                <Route path={'/proposal/:key'} children={<ProposalView />} />
                                <Route exact path="/claims" children={<AirdropView />} />
                                <Route
                                  exact
                                  path="/airdrop/history"
                                  children={<AirdropHistory />}
                                />
                                <Route exact path="/flight-logs" children={<FlightLogView />} />
                                <Route exact path="/glossary" children={<GlossaryView />} />
                                <Route exact path="/terms" children={<TermsView />} />
                              </ScrollToTop>
                            </Switch>
                          </AppLayout>
                        </ProposalProvider>
                      </AccountsProvider>
                    </AirdropProvider>
                  </ConnectWalletProvider>
                </ConfigProvider>
              </WalletProvider>
            </GovernanceProvider>
          </ConnectionProvider>
        </DarkThemeProvider>
      </ErrorBoundary>
    </HashRouter>
  );
}
