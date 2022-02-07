import { Airdrop, AirdropTarget, RewardsClient, StakeAccount, StakeBalance, StakeClient, StakePool, UnbondingAccount } from "@jet-lab/jet-engine";
import { Program } from "@project-serum/anchor";
import React, { useState, useContext } from "react";
import { MintInfo } from "@solana/spl-token"
import { useGovernance, useProposalsByGovernance, useWalletTokenOwnerRecord, useWalletVoteRecords } from "../hooks/apiHooks";
import { JET_REALM, JET_GOVERNANCE } from "../utils";
import { ParsedAccount } from ".";
import { Governance, Proposal, TokenOwnerRecord, VoteRecord } from "../models/accounts";
import { useAirdropsByWallet, useClaimsCount, useProposalFilters } from "../hooks/proposalHooks";
import { useWallet } from "@solana/wallet-adapter-react";
import { AssociatedToken } from "@jet-lab/jet-engine/lib/common";
import { useConnection } from "./connection";
import { useRealmByPubkey, useProvider } from "../hooks/apiHooks";

export type ProposalFilter = "active" | "inactive" | "passed" | "rejected" | "all";

interface ProposalContextState {
  proposalFilter: ProposalFilter
  setProposalFilter: (showing: ProposalFilter) => void

  stakeProgram?: Program
  stakePool?: StakePool
  stakeAccount?: StakeAccount
  unbondingAccounts?: UnbondingAccount[]
  stakeBalance: StakeBalance

  rewardsProgram?: Program,
  airdrops?: Airdrop[],
  airdropsByWallet?: AirdropTarget[],
  claimsCount: number

  jetAccount?: AssociatedToken
  jetMint?: MintInfo
  voteMint?: MintInfo

  governance?: ParsedAccount<Governance>,
  tokenOwnerRecord?: ParsedAccount<TokenOwnerRecord>
  walletVoteRecords: ParsedAccount<VoteRecord>[]
  proposalsByGovernance: ParsedAccount<Proposal>[]
  filteredProposalsByGovernance: ParsedAccount<Proposal>[]
}

const ProposalContext = React.createContext<ProposalContextState>({
  proposalFilter: "active",
  setProposalFilter: () => { },

  proposalsByGovernance: [],
  filteredProposalsByGovernance: [],

  claimsCount: 0,

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

  // ----- Staking -----
  const provider = useProvider(connection, wallet);
  const stakeProgram = StakeClient.use(provider);
  const stakePool = StakePool.use(stakeProgram);
  const stakeAccount = StakeAccount.use(stakeProgram, stakePool, walletAddress)
  const unbondingAccounts = UnbondingAccount.useByStakeAccount(stakeProgram, stakeAccount)
  const stakeBalance = StakeAccount.useBalance(stakeAccount, stakePool)

  // ----- Rewards Airdrops -----
  const rewardsProgram = RewardsClient.use(provider)
  const airdrops = Airdrop.useAll(rewardsProgram)
  const airdropsByWallet = useAirdropsByWallet(airdrops, walletAddress)
  const claimsCount = useClaimsCount(airdropsByWallet);

  // ----- Wallet -----
  const jetAccount = AssociatedToken.use(connection, stakePool?.stakePool.tokenMint, walletAddress)
  const jetMint = AssociatedToken.useMint(connection, stakePool?.stakePool.tokenMint);
  const voteMint = AssociatedToken.useMint(connection, stakePool?.stakePool.stakeVoteMint);

  // ----- Governance -----
  const realm = useRealmByPubkey(JET_REALM)
  const governance = useGovernance(JET_GOVERNANCE);
  const tokenOwnerRecord = useWalletTokenOwnerRecord(JET_REALM, realm?.info.communityMint)
  const walletVoteRecords = useWalletVoteRecords();
  const proposalsByGovernance = useProposalsByGovernance(JET_GOVERNANCE);
  const filteredProposalsByGovernance = useProposalFilters(proposalsByGovernance);

  return (
    <ProposalContext.Provider
      value={{
        proposalFilter,
        setProposalFilter,

        stakeProgram,
        stakePool,
        stakeAccount,
        unbondingAccounts,
        stakeBalance,

        rewardsProgram,
        airdrops,
        airdropsByWallet,
        claimsCount,

        jetAccount,
        jetMint,
        voteMint,

        governance,
        tokenOwnerRecord,
        walletVoteRecords,
        proposalsByGovernance,
        filteredProposalsByGovernance,
      }}
    >
      {children}
    </ProposalContext.Provider>
  );
}