import { HashRouter, Route, Switch } from 'react-router-dom';
import React, { useState } from 'react';
import GovernanceProvider from './contexts/GovernanceContext';
import { AllRealmsView } from './views';
import { OysterProposalView } from './views/proposal/oysterProposalView';
import { GovernanceView } from './views/governance/governanceView';
import { DevToolsView } from './views/devtools/DevToolsView';
import { RealmView } from './views/realm/realmView';

import { ErrorBoundary } from 'react-error-boundary';

import { AppErrorBanner } from './components/appErrorBanner/appErrorBanner';
import { HomeView } from './views/Home';
import { FlightLogView } from './views/FlightLog';
import { useProposal } from './contexts/proposal';
import { AirdropView } from './views/Airdrop';
import { AirdropHistory } from './views/AirdropHistory';
import { ProposalView } from './views/Proposal';
import { DarkThemeProvider } from './contexts/darkTheme';
import { ConnectWalletProvider } from './contexts/connectWallet';
import { AirdropProvider } from './contexts/airdrop';
import { AppLayout } from './components/Layout';
import { AccountsProvider, ConnectionProvider, WalletProvider } from './contexts';

export function Routes() {

  const [geobanned, setGeobanned] = useState(false);
  const { allProposals } = useProposal();

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
                            <Route exact path="/">
                              <HomeView />
                            </Route>
                            <Route exact path="/airdrop">
                              <AirdropView />
                            </Route>
                            <Route exact path="/airdrop/history">
                              <AirdropHistory />
                            </Route>
                            <Route exact path="/flight-log">
                              <FlightLogView />
                            </Route>
                            {geobanned
                              ? null
                              : allProposals.map((proposal) => (
                                <Route
                                  exact
                                  path={`/proposal/${proposal.id
                                    }/${proposal.headline.substring(0, 7)}`}
                                  key={`/proposal/${proposal.id}`}
                                >
                                  <ProposalView id={proposal.id} />
                                </Route>
                              ))}

                            {/** Old oyster paths */}
                            <Route exact path="/realms" component={() => <AllRealmsView />} />
                            <Route
                              path="/proposal/:key"
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