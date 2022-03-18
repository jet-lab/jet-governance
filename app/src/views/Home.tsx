import { ProposalFilter, useProposalContext } from "../contexts/proposal";
import { ProposalCard } from "../components/ProposalCard";
import { YourInfo } from "../components/YourInfo";
import { PastProposalCard } from "../components/MobilePastProposals";
import { ReactComponent as Filter } from "../images/filter.svg";
import { useEffect } from "react";
import { Typography } from "antd";
import "./Home.less";

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
  const { Title, Text } = Typography;
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
    <section className="home view-container content-body column-grid">
      <YourInfo />
      <div className="show-proposals">
        <Typography>
          <div className="flex justify-between header">
            <Title className="title-home" level={2}>
              Proposals
            </Title>
            <div className="filter-status">
              <Text
                onClick={() => setProposalFilter("active")}
                className={`filter-status-item ${
                  proposalFilter === "active" ? "active" : undefined
                }`}
              >
                Active
              </Text>
              <Text
                onClick={() => setProposalFilter("inactive")}
                className={`filter-status-item ${
                  proposalFilter === "inactive" ? "active" : undefined
                }`}
              >
                Inactive
              </Text>
              <Text
                onClick={() => setProposalFilter("passed")}
                className={`filter-status-item ${
                  proposalFilter === "passed" ? "active" : undefined
                }`}
              >
                Passed
              </Text>
              <Text
                onClick={() => setProposalFilter("rejected")}
                className={`filter-status-item ${
                  proposalFilter === "rejected" ? "active" : undefined
                }`}
              >
                Rejected
              </Text>
              <Text
                onClick={() => setProposalFilter("all")}
                className={`filter-status-item ${proposalFilter === "all" ? "active" : undefined}`}
              >
                All
              </Text>
            </div>
          </div>
        </Typography>
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
    </section>
  );
};
