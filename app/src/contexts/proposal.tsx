import { Airdrop, AirdropTarget, RewardsClient, StakeAccount, StakeBalance, StakeClient, StakePool, UnbondingAccount } from "@jet-lab/jet-engine";
import { Program } from "@project-serum/anchor";
import React, { useState, useContext } from "react";
import { MintInfo } from "@solana/spl-token"
import { useGovernance, useProposalsByGovernance, useWalletTokenOwnerRecord } from "../hooks/apiHooks";
import { JET_REALM, JET_GOVERNANCE } from "../utils";
import { useAirdropsByWallet, useClaimsCount, useProposalFilters, useWalletVoteRecords } from "../hooks/proposalHooks";
import { useWallet } from "@solana/wallet-adapter-react";
import { AssociatedToken } from "@jet-lab/jet-engine/lib/common";
import { useConnection } from "./connection";
import { useProvider } from "../hooks/apiHooks";
import { Governance, ProgramAccount, Proposal, Realm, TokenOwnerRecord, VoteRecord } from "@solana/spl-governance";
import { useGovernanceAccountByPubkey } from "../hooks/accountHooks";

export type ProposalFilter = "active" | "inactive" | "passed" | "rejected" | "all";

interface ProposalContextState {
  proposalFilter: ProposalFilter
  setProposalFilter: (showing: ProposalFilter) => void

  stakeProgram?: Program
  stakePool?: StakePool
  stakeAccount?: StakeAccount
  unbondingAccounts?: UnbondingAccount[]
  unbondingTotal: number
  stakeBalance: StakeBalance

  rewardsProgram?: Program,
  airdrops?: Airdrop[],
  airdropsByWallet?: AirdropTarget[],
  claimsCount: number

  jetAccount?: AssociatedToken
  jetMint?: MintInfo
  voteMint?: MintInfo

  governance?: ProgramAccount<Governance>,
  tokenOwnerRecord?: ProgramAccount<TokenOwnerRecord>
  walletVoteRecords: ProgramAccount<VoteRecord>[]
  proposalsByGovernance: ProgramAccount<Proposal>[]
  filteredProposalsByGovernance: ProgramAccount<Proposal>[]
}

const ProposalContext = React.createContext<ProposalContextState>({
  proposalFilter: "active",
  setProposalFilter: () => { },

  proposalsByGovernance: [],
  filteredProposalsByGovernance: [],

  claimsCount: 0,
  unbondingTotal: 0,

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
  const unbondingTotal = UnbondingAccount.useUnbondingAmountTotal(unbondingAccounts)
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
  const realm = useGovernanceAccountByPubkey(Realm, JET_REALM)
  const governance = useGovernance(JET_GOVERNANCE);
  const tokenOwnerRecord = useWalletTokenOwnerRecord(JET_REALM, realm?.account.communityMint)
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
        unbondingTotal,
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