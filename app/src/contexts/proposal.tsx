import { StakeAccount, StakePool } from "@jet-lab/jet-engine";
import { Program } from "@project-serum/anchor";
import React, { useState, useContext } from "react";
import { StakedBalance, useAssociatedTokenAccount, useStakeAccount, useStakedBalance, useStakePool, useStakeProgram } from "../hooks/useStaking";
import { AccountInfo as TokenAccount } from "@solana/spl-token"

export type ProposalFilter = "active" | "inactive" | "passed" | "rejected" | "all";

interface ProposalContextState {
  showing: ProposalFilter;
  setShowing: (showing: ProposalFilter) => void;
  stakeProgram?: Program,
  stakePool?: StakePool,
  stakeAccount?: StakeAccount,
  jetAccount?: TokenAccount,
  voteAccount?: TokenAccount,
  stakedBalance: StakedBalance,
}

const ProposalContext = React.createContext<ProposalContextState>({
  showing: "active",
  setShowing: () => { },
  stakedBalance: {
    unstakedJet: 0,
    unlockedVotes: 0,
    stakedJet: 0,
    unbondingJet: 0
  },
});

export const useProposalContext = () => {
  const proposal = useContext(ProposalContext);
  return proposal;
};

export function ProposalProvider({ children = undefined as any }) {
  const [showing, setShowing] = useState<ProposalFilter>("active");

  const stakeProgram = useStakeProgram();
  const stakePool = useStakePool(stakeProgram);
  const stakeAccount = useStakeAccount(stakeProgram, stakePool)
  const stakedBalance = useStakedBalance(stakeAccount, stakePool)
  const jetAccount = useAssociatedTokenAccount(stakePool?.stakePool.tokenMint)
  const voteAccount = useAssociatedTokenAccount(stakePool?.addresses.stakeVoteMint.address)

  return (
    <ProposalContext.Provider
      value={{
        showing,
        setShowing,
        stakeProgram,
        stakePool,
        stakeAccount,
        jetAccount,
        voteAccount,
        stakedBalance,
      }}
    >
      {children}
    </ProposalContext.Provider>
  );
}