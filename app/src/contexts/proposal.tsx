import {
  Airdrop,
  AssociatedToken,
  Distribution,
  DistributionYield,
  JetMint,
  RewardsClient,
  RewardsIdl,
  StakeAccount,
  StakeBalance,
  StakeClient,
  StakeIdl,
  StakePool,
  UnbondingAccount,
  UnbondingAmount
} from "@jet-lab/jet-engine";
import { BN, Program } from "@project-serum/anchor";
import {
  getGovernanceAccount,
  getProposalsByGovernance,
  getTokenOwnerRecordForRealm,
  getVoteRecordsByVoter,
  Governance,
  ProgramAccount,
  Proposal,
  Realm,
  TokenOwnerRecord,
  VoteRecord
} from "@solana/spl-governance";
import { useWallet } from "@solana/wallet-adapter-react";
import { createContext, useState, useContext, useMemo } from "react";
import { useQuery, useQueryClient } from "react-query";
import { useConnectionConfig } from ".";
import { useConnection } from "./connection";
import {
  useAirdropsByWallet,
  useAvailableAirdrop,
  useClaimsCount,
  useProposalFilters,
  useProvider,
  useRpcContext
} from "../hooks";
import { JET_REALM, JET_GOVERNANCE } from "../utils";

export type ProposalFilter = "active" | "inactive" | "passed" | "rejected" | "all";

interface ProposalContextState {
  proposalFilter: ProposalFilter;
  setProposalFilter: (showing: ProposalFilter) => void;
  pastProposalFilter: ProposalFilter;
  setPastProposalFilter: (showing: ProposalFilter) => void;
  refresh: () => void;
  walletFetched: boolean;

  stakePool?: StakePool;
  stakeAccount?: StakeAccount;
  unbondingAccounts?: UnbondingAccount[];
  unbondingTotal: UnbondingAmount;
  stakeBalance: StakeBalance;

  distributions?: Distribution[];
  stakingYield?: DistributionYield;
  airdrops?: Airdrop[];
  airdropsByWallet?: Airdrop[];
  claimsCount: number;
  availableAirdrop?: Airdrop[];

  jetAccount?: AssociatedToken;
  jetMint?: JetMint;

  realm?: ProgramAccount<Realm>;
  governance?: ProgramAccount<Governance>;
  tokenOwnerRecord?: ProgramAccount<TokenOwnerRecord>;
  walletVoteRecords?: ProgramAccount<VoteRecord>[];
  proposalsByGovernance?: ProgramAccount<Proposal>[];
  filteredProposalsByGovernance: ProgramAccount<Proposal>[];
  filteredPastProposals: ProgramAccount<Proposal>[];

  programs?: {
    stake: Program<StakeIdl>;
    rewards: Program<RewardsIdl>;
  };
}

const ProposalContext = createContext<ProposalContextState>({
  proposalFilter: "active",
  setProposalFilter: () => {},
  pastProposalFilter: "all",
  setPastProposalFilter: () => {},
  refresh: () => {},
  walletFetched: false,

  filteredProposalsByGovernance: [],
  filteredPastProposals: [],

  claimsCount: 0,
  unbondingTotal: {
    unbondingQueue: new BN(0),
    unbondingComplete: new BN(0)
  },

  stakeBalance: {
    stakedJet: undefined,
    unbondingJet: undefined
  }
});

export const useProposalContext = () => {
  return useContext(ProposalContext);
};

export function ProposalProvider({ children = undefined as any }) {
  const walletContext = useWallet();
  const walletAddress = walletContext.publicKey ?? undefined;
  const connection = useConnection();
  const { endpoint } = useConnectionConfig();
  const { programId: governanceProgramId } = useRpcContext();
  const [proposalFilter, setProposalFilter] = useState<ProposalFilter>("active");
  const [pastProposalFilter, setPastProposalFilter] = useState<ProposalFilter>("all");
  const provider = useProvider();
  const queryClient = useQueryClient();

  const { data: idl } = useQuery(["idl"], async () => {
    const stake = await Program.fetchIdl<StakeIdl>(StakeClient.PROGRAM_ID, provider);
    const rewards = await Program.fetchIdl<RewardsIdl>(RewardsClient.PROGRAM_ID, provider);
    if (!stake || !rewards) {
      throw new Error("idl does not exist");
    }
    return { stake, rewards };
  });

  const programs = useMemo(() => {
    if (idl) {
      return {
        stake: new Program(idl.stake, StakeClient.PROGRAM_ID, provider),
        rewards: new Program(idl.rewards, RewardsClient.PROGRAM_ID, provider)
      };
    }
  }, [provider, idl]);

  const { data: realm } = useQuery(
    ["realm", endpoint],
    async () => {
      if (!programs) {
        return;
      }

      // ----- Staking Rewards -----
      const now = new BN(new Date().getTime() / 1000);
      const distributions = (await Distribution.loadAll(programs.rewards)).filter(dist =>
        dist.isActive(now)
      );

      // ----- Governance -----
      const realm = await getGovernanceAccount(connection, JET_REALM, Realm);
      const governance = await getGovernanceAccount(connection, JET_GOVERNANCE, Governance);

      return {
        distributions,
        realm,
        governance
      };
    },
    {
      enabled: !!programs
    }
  );

  const { data: stakePool } = useQuery(
    ["stakePool", endpoint],
    async () => {
      if (!programs) {
        console.log("programs do not exist");
        return;
      }

      // ----- Governance -----
      const proposalsByGovernance = await getProposalsByGovernance(
        connection,
        governanceProgramId,
        JET_GOVERNANCE
      );
      // ----- Staking -----
      const stakePool = await StakePool.load(programs.stake, StakePool.CANONICAL_SEED);

      // ----- Airdrops -----
      const airdrops = await Airdrop.loadAll(programs.rewards, stakePool.addresses.stakePool);

      // ----- Mints -----
      const jetMint = await AssociatedToken.loadMint(connection, stakePool.stakePool.tokenMint);
      return { proposalsByGovernance, stakePool, airdrops, jetMint };
    },
    { enabled: !!programs }
  );

  const { data: wallet, isFetched: walletFetched } = useQuery(
    ["wallet", endpoint, walletAddress?.toBase58()],
    async () => {
      if (!programs || !stakePool || !walletAddress || !realm) {
        console.log("Stakepool does not exist");
        return;
      }
      // ----- Tokens -----
      const jetAccount = await AssociatedToken.load(
        connection,
        stakePool.stakePool.stakePool.tokenMint,
        walletAddress
      );

      // ----- Staking -----
      let stakeAccount: StakeAccount | undefined;
      try {
        stakeAccount = await StakeAccount.load(
          programs.stake,
          stakePool.stakePool.addresses.stakePool,
          walletAddress
        );
      } catch {}
      let unbondingAccounts: UnbondingAccount[] | undefined;
      try {
        if (stakeAccount) {
          unbondingAccounts = await UnbondingAccount.loadByStakeAccount(
            programs.stake,
            stakeAccount.addresses.stakeAccount,
            stakePool.stakePool
          );
        }
      } catch {}

      // ----- Governance -----
      let tokenOwnerRecord: ProgramAccount<TokenOwnerRecord> | undefined;
      try {
        tokenOwnerRecord = await getTokenOwnerRecordForRealm(
          connection,
          governanceProgramId,
          JET_REALM,
          realm.realm.account.communityMint,
          walletAddress
        );
      } catch {}

      const walletVoteRecords = await getVoteRecordsByVoter(
        connection,
        governanceProgramId,
        walletAddress
      );

      return { jetAccount, stakeAccount, unbondingAccounts, tokenOwnerRecord, walletVoteRecords };
    },
    {
      enabled: !!programs && !!stakePool && !!realm && !!walletAddress
    }
  );

  // ----- Staking -----
  const unbondingTotal = UnbondingAccount.useUnbondingAmountTotal(wallet?.unbondingAccounts);
  const stakeBalance = StakeAccount.useBalance(wallet?.stakeAccount, stakePool?.stakePool);

  // ----- Staking Rewards -----
  const stakingYield = Distribution.useEstimateCombinedYield(
    realm?.distributions,
    stakePool?.stakePool,
    wallet?.stakeAccount
  );

  // ----- Airdrops -----
  const airdropsByWallet = useAirdropsByWallet(stakePool?.airdrops, walletAddress);
  const claimsCount = useClaimsCount(airdropsByWallet, walletAddress);
  const availableAirdrop = useAvailableAirdrop(airdropsByWallet, walletAddress);

  // ----- Governance -----
  const filteredProposalsByGovernance = useProposalFilters(
    stakePool?.proposalsByGovernance,
    proposalFilter,
    realm?.governance.account
  );
  const pastProposals = useProposalFilters(
    stakePool?.proposalsByGovernance,
    "inactive",
    realm?.governance.account
  );
  const filteredPastProposals = useProposalFilters(
    pastProposals,
    pastProposalFilter,
    realm?.governance.account
  );

  function refresh() {
    setTimeout(() => {
      queryClient.invalidateQueries("stakePool");
      queryClient.invalidateQueries("wallet");
    }, 2000);
  }

  return (
    <ProposalContext.Provider
      value={{
        proposalFilter,
        setProposalFilter,
        pastProposalFilter,
        setPastProposalFilter,
        refresh,
        walletFetched,

        stakingYield,

        unbondingTotal,
        stakeBalance,

        airdropsByWallet,
        claimsCount,
        availableAirdrop,

        filteredProposalsByGovernance,
        filteredPastProposals,

        programs,
        ...realm,
        ...stakePool,
        ...wallet
      }}
    >
      {children}
    </ProposalContext.Provider>
  );
}
