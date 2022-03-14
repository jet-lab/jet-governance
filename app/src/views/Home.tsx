import { ProposalFilter, useProposalContext } from "../contexts/proposal";
import { ProposalCard } from "../components/ProposalCard";
import { YourInfo } from "../components/YourInfo";
import { PastProposalCard } from "../components/MobilePastProposals";
// import { getFirstTwoHundredPubkeys } from "../models/PUBKEYS_INDEX";
import { ReactComponent as Filter } from "../images/filter.svg";
import { useEffect } from "react";

export const HomeView = () => {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const {
    proposalFilter,
    setProposalFilter,
    setPastProposalFilter,

    filteredProposalsByGovernance,
    filteredPastProposals,

    governance
  } = useProposalContext();
  /* eslint-enable @typescript-eslint/no-unused-vars */

  // First 200 Public Keys
  //getFirstTwoHundredPubkeys(realm?.account.communityMint);

  // On mobile, only show active proposals
  // in main view

  useEffect(() => {
    const onResize = () => {
      if (window.matchMedia("(max-width: 840px)").matches) {
        setProposalFilter("active");
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [setProposalFilter]);

  const toggleShowFilter = () => {
    document.getElementById("filter")?.classList.toggle("hidden");
  };

  const handleSetPastProposalFilter = (string: ProposalFilter) => {
    setPastProposalFilter(string);
    toggleShowFilter();
  };

  return (
    <div className="view-container content-body column-grid" id="home">
      <YourInfo />

      <div id="show-proposals">
        <div className="flex justify-between header">
          <h2>Proposals</h2>
          <div className="filter-status">
            <span
              onClick={() => setProposalFilter("active")}
              className={proposalFilter === "active" ? "active" : undefined}
            >
              Active
            </span>
            <span
              onClick={() => setProposalFilter("inactive")}
              className={proposalFilter === "inactive" ? "active" : undefined}
            >
              Inactive
            </span>
            <span
              onClick={() => setProposalFilter("passed")}
              className={proposalFilter === "passed" ? "active" : undefined}
            >
              Passed
            </span>
            <span
              onClick={() => setProposalFilter("rejected")}
              className={proposalFilter === "rejected" ? "active" : undefined}
            >
              Rejected
            </span>
            <span
              onClick={() => setProposalFilter("all")}
              className={proposalFilter === "all" ? "active" : undefined}
            >
              All
            </span>
          </div>
        </div>

        <div id="proposal-cards">
          {filteredProposalsByGovernance.map(
            proposal =>
              governance && (
                <ProposalCard
                  proposal={proposal}
                  governance={governance}
                  key={proposal.pubkey.toBase58()}
                />
              )
          )}
        </div>
      </div>

      <div className="mobile-only" id="past-proposals">
        <span className="title">
          <h2>Past Proposals</h2>
          <Filter onClick={toggleShowFilter} />
          <div id="filter" className="hidden">
            <ul>
              <li onClick={() => handleSetPastProposalFilter("all")}>All</li>
              <li onClick={() => handleSetPastProposalFilter("passed")}>Passed</li>
              <li onClick={() => handleSetPastProposalFilter("rejected")}>Rejected</li>
            </ul>
          </div>
        </span>
        {filteredPastProposals.map(
          proposal =>
            governance && (
              <PastProposalCard
                proposal={proposal}
                governance={governance}
                key={proposal.pubkey.toBase58()}
              />
            )
        )}
        <p>That's all for now! Check back soon for new proposals.</p>
      </div>
    </div>
  );
};
