import { HashRouter, Route, Switch } from 'react-router-dom';
import React from 'react';
import GovernanceProvider from './contexts/GovernanceContext';
import { AllRealmsView } from './views';
import { OysterProposalView } from './views/proposal/oysterProposalView';
import { GovernanceView } from './views/governance/governanceView';
import { DevToolsView } from './views/devtools/DevToolsView';
import { RealmView } from './views/realm/realmView';

import { ErrorBoundary } from 'react-error-boundary';

import { AppErrorBanner } from './components/appErrorBanner/appErrorBanner';
import { HomeView } from './views/Home';
import { FlightLogView } from './views/FlightLogs';
import { AirdropView } from './views/Airdrop';
import { AirdropHistory } from './views/AirdropHistory';
import { ProposalView } from './views/Proposal';
import { DarkThemeProvider } from './contexts/darkTheme';
import { ConnectWalletProvider } from './contexts/connectWallet';
import { AirdropProvider } from './contexts/airdrop';
import { AppLayout } from './components/Layout';
import { AccountsProvider, ConnectionProvider, WalletProvider } from './contexts';
import { ScrollToTop } from './contexts/scrollToTop';

export function Routes() {

  //   const [geobanned, setGeobanned] = useState(false);

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
    <>
      <HashRouter basename={'/'}>
        {/* TODO: Adding the error boundary as a quick fix to avoid black screens
        for crashes However we should make it nicer and hide the technical
        details from users by default */}
        <ErrorBoundary FallbackComponent={AppErrorBanner}>
          <DarkThemeProvider>
            <ConnectionProvider>
              <WalletProvider>
                <ConnectWalletProvider>
                  <AirdropProvider>
                    <AccountsProvider>
                      <GovernanceProvider>
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
                              exact path="/airdrop"
                              children={<AirdropView/>}/>
                            <Route 
                              exact path="/airdrop/history"
                              children={<AirdropHistory />}/>
                            <Route 
                              exact path="/flight-logs"
                              children={<FlightLogView />}/>

                            {/** Old oyster paths */}
                            <Route exact path="/realms" component={() => <AllRealmsView />} />
                            <Route
                              path="/proposal-oyster/:key"
                              children={<OysterProposalView />}
                            />
                            <Route
                              path="/governance/:key"
                              children={<GovernanceView />}
                            />
                            <Route path="/realm/:key" children={<RealmView />} />
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
                </ConnectWalletProvider>
              </WalletProvider>
            </ConnectionProvider>
          </DarkThemeProvider>
        </ErrorBoundary>
      </HashRouter>
    </>
  );
}
