
import { useState } from "react";
import { useProposalContext } from "../contexts/proposal";
import { ProposalCard } from "../components/ProposalCard";
import { Button, Divider, notification, Tooltip, Switch } from "antd";
import { useDarkTheme } from "../contexts/darkTheme";
import { Input } from "../components/Input";
import { StakeModal } from "../components/modals/StakeModal";
import { UnstakeModal } from "../components/modals/UnstakeModal";
import { InfoCircleFilled, PlusOutlined } from "@ant-design/icons";
import { useAirdrop } from "../contexts/airdrop";
import { jetFaucet } from "../actions/jetFaucet";
import { COUNCIL_FAUCET_DEVNET, COUNCIL_TOKEN_MINT, JET_FAUCET_DEVNET, JET_REALM, JET_TOKEN_MINT } from "../utils";
import { ReactFitty } from "react-fitty";
import { FooterLinks } from "../components/FooterLinks";
import { bnToNumber } from "@jet-lab/jet-engine";
import { fromLamports } from "../utils";
import { useConnectionConfig, useMint } from "../contexts";
import { useWithdrawVotesAbility } from "../hooks/proposalHooks";
import { YourInfo } from "../components/YourInfo";
import { useWallet } from "@solana/wallet-adapter-react";

export const HomeView = () => {
  const [stakeModalVisible, setStakeModalVisible] = useState(false);
  const [unstakeModalVisible, setUnstakeModalVisible] = useState(false);

  const [inputAmount, setInputAmount] = useState<number | undefined>();
  const { vestedAirdrops } = useAirdrop();
  const { connected } = useWallet();
  const { darkTheme, toggleDarkTheme } = useDarkTheme();
  const { env } = useConnectionConfig()
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const {
    proposalFilter,
    setProposalFilter,

    proposalsByGovernance,
    filteredProposalsByGovernance,

    stakeProgram,
    stakePool,
    stakeAccount,
    unbondingTotal,
    stakeBalance: {
      stakedJet,
      unstakedJet,
      unlockedVotes,
    },

    jetAccount,
    jetMint,

    governance,
    tokenOwnerRecord,
    walletVoteRecords,
  } = useProposalContext();
  const withdrawVotesAbility = useWithdrawVotesAbility(tokenOwnerRecord);
  /* eslint-enable @typescript-eslint/no-unused-vars */

  const totalDailyReward = 1000000
  const totalStake = 1500000
  const userDailyReward = totalDailyReward * (stakedJet ?? 0) / totalStake

  const mint = useMint(JET_TOKEN_MINT)

  const handleStake = () => {
    if (!jetMint || !inputAmount || !jetAccount) {
      return;
    }
    const balance = bnToNumber(jetAccount.info.amount) / 10 ** jetMint.decimals
    const stakable = Math.min(inputAmount, balance)

    setInputAmount(stakable);
    setStakeModalVisible(true)
  }
  
  return (
    <div className="view-container content-body column-grid" id="home">
      <YourInfo />

      <div id="show-proposals">
        <div className="flex justify-between header">
          <h2>Proposals</h2>
          <div className="filter-status">
            <span onClick={() => setProposalFilter("active")} className={proposalFilter === "active" ? "active" : undefined}>Active</span>
            <span onClick={() => setProposalFilter("inactive")} className={proposalFilter === "inactive" ? "active" : undefined}>Inactive</span>
            <span onClick={() => setProposalFilter("passed")} className={proposalFilter === "passed" ? "active" : undefined}>Passed</span>
            <span onClick={() => setProposalFilter("rejected")} className={proposalFilter === "rejected" ? "active" : undefined}>Rejected</span>
            <span onClick={() => setProposalFilter("all")} className={proposalFilter === "all" ? "active" : undefined}>All</span>
          </div>
        </div>

        <div id="proposal-cards">
          {filteredProposalsByGovernance.map(
            (proposal) =>
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
    </div>
  );
};
