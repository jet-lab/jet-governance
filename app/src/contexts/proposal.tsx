import { StakeAccount, StakeBalance, StakeClient, StakePool, UnbondingAccount } from "@jet-lab/jet-engine";
import { Program } from "@project-serum/anchor";
import React, { useState, useContext } from "react";
import { MintInfo } from "@solana/spl-token"
import { useGovernance, useProposalsByGovernance, useWalletTokenOwnerRecord, useWalletVoteRecords } from "../hooks/apiHooks";
import { JET_REALM, JET_GOVERNANCE } from "../utils";
import { ParsedAccount } from ".";
import { Governance, Proposal, TokenOwnerRecord, VoteRecord } from "../models/accounts";
import { useProposalFilters } from "../hooks/proposalHooks";
import { useWallet } from "@solana/wallet-adapter-react";
import { AssociatedToken, useProvider } from "@jet-lab/jet-engine/lib/common";
import { useConnection } from "./connection";

export type ProposalFilter = "active" | "inactive" | "passed" | "rejected" | "all";

interface ProposalContextState {
  proposalFilter: ProposalFilter
  setProposalFilter: (showing: ProposalFilter) => void
  
  proposalsByGovernance: ParsedAccount<Proposal>[]
  filteredProposalsByGovernance: ParsedAccount<Proposal>[]

  stakeProgram?: Program
  stakePool?: StakePool
  stakeAccount?: StakeAccount
  unbondingAccounts?: UnbondingAccount[]
  stakeBalance: StakeBalance

  jetAccount?: AssociatedToken
  jetMint?: MintInfo
  voteMint?: MintInfo

  governance?: ParsedAccount<Governance>,
  tokenOwnerRecord?: ParsedAccount<TokenOwnerRecord>
  walletVoteRecords: ParsedAccount<VoteRecord>[]
}

const ProposalContext = React.createContext<ProposalContextState>({
  proposalFilter: "active",
  setProposalFilter: () => { },

  proposalsByGovernance: [],
  filteredProposalsByGovernance: [],

  stakeBalance: {
    unstakedJet: 0,
    unlockedVotes: 0,
    stakedJet: 0,
    unbondingJet: 0
  },
  walletVoteRecords: []
});

export const useProposalContext = () => {
  return useContext(ProposalContext);
};

export function ProposalProvider({ children = undefined as any }) {
  const wallet = useWallet()
  const walletAddress = wallet.publicKey ?? undefined;
  const connection = useConnection()
  const [proposalFilter, setProposalFilter] = useState<ProposalFilter>("active");

  // ----- Proposals -----
  const proposalsByGovernance = useProposalsByGovernance();
  const filteredProposalsByGovernance = useProposalFilters(proposalsByGovernance);

  // ----- Staking -----
  const provider = useProvider(connection, wallet)
  const stakeProgram = StakeClient.use(provider);
  const stakePool = StakePool.use(stakeProgram);
  const stakeAccount = StakeAccount.use(stakeProgram, stakePool, walletAddress)
  const unbondingAccounts = UnbondingAccount.useByStakeAccount(stakeProgram, stakeAccount)
  const stakeBalance = StakeAccount.useBalance(stakeAccount, stakePool)
  
  const jetAccount = AssociatedToken.use(connection, stakePool?.stakePool.tokenMint, walletAddress)
  const jetMint = AssociatedToken.useMint(connection, stakePool?.stakePool.tokenMint);
  const voteMint = AssociatedToken.useMint(connection, stakePool?.stakePool.stakeVoteMint);

  // ----- Governance Records -----
  const governance = useGovernance();
  const tokenOwnerRecord = useWalletTokenOwnerRecord(JET_REALM, JET_GOVERNANCE)
  const walletVoteRecords = useWalletVoteRecords();

  return (
    <ProposalContext.Provider
      value={{
        proposalFilter,
        setProposalFilter,

        proposalsByGovernance,
        filteredProposalsByGovernance,

        stakeProgram,
        stakePool,
        stakeAccount,
        unbondingAccounts,
        stakeBalance,

        jetAccount,
        jetMint,
        voteMint,

        governance,
        tokenOwnerRecord,
        walletVoteRecords,
      }}
    >
      {children}
    </ProposalContext.Provider>
  );
}