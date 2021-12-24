import React, { useState, useContext } from "react";

export type ProposalFilter = "active" | "inactive" | "passed" | "rejected" | "all";

interface ProposalConfig {
  showing: ProposalFilter;
  setShowing: (showing: ProposalFilter) => void;
}

const ProposalContext = React.createContext<ProposalConfig>({
  showing: "active",
  setShowing: () => { },
});

export function ProposalProvider({ children = undefined as any }) {
  const [showing, setShowing] = useState<ProposalFilter>("active");

  return (
    <ProposalContext.Provider
      value={{
        showing,
        setShowing,
      }}
    >
      {children}
    </ProposalContext.Provider>
  );
}

export const useProposalContext = () => {
  const proposal = useContext(ProposalContext);
  return proposal;
};
