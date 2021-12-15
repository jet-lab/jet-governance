import React, { useState, useContext, useEffect } from "react";
import { proposals } from "../hooks/useClient";
import { INITIAL_STATE, ProposalState } from "../models/INITIAL_PROPOSALS";

interface ProposalConfig {
  allProposals: ProposalState[];
  activeProposals: ProposalState[];
  showing: string;
  setShowing: (showing: string) => void;
  shownProposals: ProposalState[];
  setShownProposals: (shownProposals: ProposalState[]) => void;
}

const ProposalContext = React.createContext<ProposalConfig>({
  allProposals: INITIAL_STATE,
  activeProposals: INITIAL_STATE.filter((p) => !p.result),
  showing: "active",
  setShowing: () => {},
  shownProposals: INITIAL_STATE,
  setShownProposals: () => { },
});

export function ProposalProvider({ children = undefined as any }) {
  const [showing, setShowing] = useState("active");
  const [shownProposals, setShownProposals] = useState(INITIAL_STATE);

  const allProposals = INITIAL_STATE;
  const activeProposals = INITIAL_STATE.filter((p) => !p.result);

  useEffect(() => {
    if (showing === "active") {
      setShownProposals(INITIAL_STATE.filter((p) => !p.result));
    } else if (showing === "inactive") {
      setShownProposals(INITIAL_STATE.filter((p) => p.result === "inactive"));
    } else if (showing === "passed") {
      setShownProposals(INITIAL_STATE.filter((p) => p.result === "passed"));
    } else if (showing === "rejected") {
      setShownProposals(INITIAL_STATE.filter((p) => p.result === "rejected"));
    } else if (showing === "all") {
      setShownProposals(INITIAL_STATE);
    }
  }, [showing]);

  return (
    <ProposalContext.Provider
      value={{
        allProposals,
        activeProposals,
        showing,
        setShowing,
        shownProposals,
        setShownProposals,
      }}
    >
      {children}
    </ProposalContext.Provider>
  );
}

export const useProposal = () => {
  const proposal = useContext(ProposalContext);
  return proposal;
};
