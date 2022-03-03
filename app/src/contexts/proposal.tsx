import {
  Airdrop,
  Distribution,
  RewardsClient,
  StakeAccount,
  StakeBalance,
  StakeClient,
  StakePool,
  UnbondingAccount
} from '@jet-lab/jet-engine';
import { Program } from '@project-serum/anchor';
import React, { useState, useContext } from 'react';
import { MintInfo } from '@solana/spl-token';
import {
  useGovernance,
  useProposalsByGovernance,
  useWalletTokenOwnerRecord
} from '../hooks/apiHooks';
import { JET_REALM, JET_GOVERNANCE, fromLamports } from '../utils';
import {
  useAirdropsByWallet,
  useClaimsCount,
  useProposalFilters,
  useStakingCompatibleWithRealm as useStakePoolCompatibleWithRealm,
  useWalletVoteRecords
} from '../hooks/proposalHooks';
import { useWallet } from '@solana/wallet-adapter-react';
import { AssociatedToken, bnToNumber } from '@jet-lab/jet-engine/lib/common';
import { useConnection } from './connection';
import { useProvider } from '../hooks/apiHooks';
import {
  Governance,
  ProgramAccount,
  Proposal,
  Realm,
  TokenOwnerRecord,
  VoteRecord
} from '@solana/spl-governance';
import { useGovernanceAccountByPubkey } from '../hooks/accountHooks';
import { DistributionYield } from '@jet-lab/jet-engine/lib/rewards/distribution';

export type ProposalFilter = 'active' | 'inactive' | 'passed' | 'rejected' | 'all';

interface ProposalContextState {
  proposalFilter: ProposalFilter;
  setProposalFilter: (showing: ProposalFilter) => void;
  pastProposalFilter: ProposalFilter;
  setPastProposalFilter: (showing: ProposalFilter) => void;

  stakeProgram?: Program;
  stakePool?: StakePool;
  stakeAccount?: StakeAccount;
  unbondingAccounts?: UnbondingAccount[];
  unbondingTotal: number;
  stakeBalance: StakeBalance;

  rewardsProgram?: Program;
  distributions?: Distribution[];
  activeDistributions?: Distribution[];
  stakingYield?: DistributionYield;
  airdrops?: Airdrop[];
  airdropsByWallet?: Airdrop[];
  claimsCount: number;

  jetAccount?: AssociatedToken;
  jetMint?: MintInfo;
  voteMint?: MintInfo;
  stakedJet: number;
  jetPerStakedShare: number;
  dailyUserRewardPercentage: number;

  realm?: ProgramAccount<Realm>;
  governance?: ProgramAccount<Governance>;
  tokenOwnerRecord?: ProgramAccount<TokenOwnerRecord>;
  walletVoteRecords: ProgramAccount<VoteRecord>[];
  proposalsByGovernance: ProgramAccount<Proposal>[];
  filteredProposalsByGovernance: ProgramAccount<Proposal>[];
  filteredPastProposals: ProgramAccount<Proposal>[];
}

const ProposalContext = React.createContext<ProposalContextState>({
  proposalFilter: 'active',
  setProposalFilter: () => {},
  pastProposalFilter: 'all',
  setPastProposalFilter: () => {},

  proposalsByGovernance: [],
  filteredProposalsByGovernance: [],
  filteredPastProposals: [],

  claimsCount: 0,
  unbondingTotal: 0,
  stakedJet: 0,
  dailyUserRewardPercentage: 0,
  jetPerStakedShare: 0,

  stakeBalance: {
    stakedJet: 0,
    unbondingJet: 0
  },
  walletVoteRecords: []
});

export const useProposalContext = () => {
  return useContext(ProposalContext);
};

export function ProposalProvider({ children = undefined as any }) {
  const wallet = useWallet();
  const walletAddress = wallet.publicKey ?? undefined;
  const connection = useConnection();
  const [proposalFilter, setProposalFilter] = useState<ProposalFilter>('active');
  const [pastProposalFilter, setPastProposalFilter] = useState<ProposalFilter>('all');

  // ----- Staking -----
  const provider = useProvider(connection, wallet);
  const stakeProgram = StakeClient.use(provider);
  const stakePool = StakePool.use(stakeProgram);
  const stakeAccount = StakeAccount.use(stakeProgram, stakePool, walletAddress);
  const unbondingAccounts = UnbondingAccount.useByStakeAccount(stakeProgram, stakeAccount);
  const unbondingTotal = UnbondingAccount.useUnbondingAmountTotal(unbondingAccounts);
  const stakeBalance = StakeAccount.useBalance(stakeAccount, stakePool);

  // ----- Staking Rewards -----
  const rewardsProgram = RewardsClient.use(provider);
  const distributions = Distribution.useAll(rewardsProgram);
  const activeDistributions = Distribution.useActive(distributions);
  const stakingYield = Distribution.useEstimateCombinedYield(
    activeDistributions,
    stakePool,
    stakeAccount
  );

  // ----- Airdrops -----
  const airdrops = Airdrop.useAll(rewardsProgram);
  const airdropsByWallet = useAirdropsByWallet(airdrops, walletAddress);
  const claimsCount = useClaimsCount(airdropsByWallet, walletAddress);

  // ----- Wallet -----
  const jetAccount = AssociatedToken.use(connection, stakePool?.stakePool.tokenMint, walletAddress);
  const jetMint = AssociatedToken.useMint(connection, stakePool?.stakePool.tokenMint);
  const voteMint = AssociatedToken.useMint(connection, stakePool?.stakePool.stakeVoteMint);

  // TODO: Move this section into jet-engine
  const jetPerStakedShare = bnToNumber(
    stakePool?.vault.amount.div(stakePool?.stakePool.sharesBonded)
  );
  const stakedJet = bnToNumber(stakeAccount?.stakeAccount.shares) * jetPerStakedShare;
  const unstakedJet = bnToNumber(stakeAccount?.stakeAccount.unbonding) * jetPerStakedShare;
  // (total JET supply / total stake pool shares) * user's shares
  const dailyUserRewardPercentage =
    stakeBalance.stakedJet / bnToNumber(stakePool?.stakePool.sharesBonded);

  // ----- Governance -----
  const realm = useGovernanceAccountByPubkey(Realm, JET_REALM);
  const governance = useGovernance(JET_GOVERNANCE);
  const tokenOwnerRecord = useWalletTokenOwnerRecord(JET_REALM, realm?.account.communityMint);
  const walletVoteRecords = useWalletVoteRecords();
  const proposalsByGovernance = useProposalsByGovernance(JET_GOVERNANCE);
  const filteredProposalsByGovernance = useProposalFilters(proposalsByGovernance, proposalFilter);
  const pastProposals = useProposalFilters(proposalsByGovernance, 'inactive');
  const filteredPastProposals = useProposalFilters(pastProposals, pastProposalFilter);

  useStakePoolCompatibleWithRealm(stakePool, realm);

  return (
    <ProposalContext.Provider
      value={{
        proposalFilter,
        setProposalFilter,
        pastProposalFilter,
        setPastProposalFilter,

        stakeProgram,
        distributions,
        activeDistributions,
        stakingYield,

        stakePool,
        stakeAccount,
        unbondingAccounts,
        unbondingTotal,
        stakeBalance,
        dailyUserRewardPercentage,

        rewardsProgram,
        airdrops,
        airdropsByWallet,
        claimsCount,

        jetAccount,
        jetMint,
        voteMint,
        stakedJet,
        jetPerStakedShare,

        realm,
        governance,
        tokenOwnerRecord,
        walletVoteRecords,
        proposalsByGovernance,
        filteredProposalsByGovernance,
        filteredPastProposals
      }}
    >
      {children}
    </ProposalContext.Provider>
  );
}
