import { useState } from "react";
import { useProposalContext } from "../contexts/proposal";
import { ProposalCard } from "../components/ProposalCard";
import { Button, Divider, notification } from "antd";
import { useUser } from "../hooks/useClient";
import { Input } from "../components/Input";
import { StakeModal } from "../components/modals/StakeModal";
import { UnstakeModal } from "../components/modals/UnstakeModal";
import { VotingBalanceModal } from "../components/modals/VotingBalanceModal";
import { InfoCircleOutlined } from "@ant-design/icons";
import { useAirdrop } from "../contexts/airdrop";
import React from "react";
import { useRpcContext } from "../hooks/useRpcContext";
import { jetFaucet } from "../actions/jetFaucet";
import { useGovernance, useProposalsByGovernance } from "../hooks/apiHooks";
import { JET_GOVERNANCE } from "../utils";
import { useProposalFilters } from "../hooks/proposalHooks";

export const HomeView = () => {
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [showUnstakeModal, setShowUnstakeModal] = useState(false);
  const [showVotingBalanceModal, setShowVotingBalanceModal] = useState(false);

  const { showing, setShowing } = useProposalContext();
  const [inputAmount, setInputAmount] = useState<number | null>(null);
  const { votingBalance, stakedBalance } = useUser();
  const { vestedAirdrops } = useAirdrop();
  const rpcContext = useRpcContext();
  const connected = rpcContext.wallet.connected

  const proposals = useProposalsByGovernance(JET_GOVERNANCE);
  const filteredProposals = useProposalFilters(proposals);

  let governance = useGovernance(JET_GOVERNANCE);

  const totalDailyReward = 1000000
  const totalStake = 1500000
  const userDailyReward = totalDailyReward * stakedBalance / totalStake

  // Devnet only: airdrop JET tokens
  const getAirdrop = async () => {
    try {
      await jetFaucet(rpcContext)
    } catch { }
  };

  const openNotification = () => {
    const vestedAirdropNotifications = vestedAirdrops();
    vestedAirdropNotifications.map(
      (airdrop: {
        name: string;
        amount: number;
        end: Date;
        claimed: boolean;
        vested: boolean;
      }) =>
        notification.open({
          message: "Fully vested",
          description: `${airdrop.name} has fully vested and may now be unstaked! Click for info.`,
          onClick: () => {
            console.log("Go to Airdrop page");
          },
          placement: "bottomRight",
        })
    );
  };

  return (
    <div className="view-container content-body">
      <div className="panel">
        <h2>
          Your Info
        </h2>

        <div className="neu-inset" style={{ maxWidth: "260px" }}>
          <h3>Votes{" "}
            <InfoCircleOutlined onClick={() => setShowVotingBalanceModal(true)} />
          </h3>
          <VotingBalanceModal
            showModal={showVotingBalanceModal}
            setShowModal={setShowVotingBalanceModal}
          />

          <div className="text-gradient staked-balance" id="resize">
            {connected ? new Intl.NumberFormat().format(votingBalance) : 0}
          </div>

          <Button onClick={getAirdrop}>GET JET</Button>
          <div id="wallet-overview" className="flex justify-between column">
            <div className="flex justify-between" id="current-staking-apr">
              <span>Current Staking APR</span>
              <span>{(365 * userDailyReward / totalStake).toFixed(2)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Est. Daily Reward</span>
              <span>{userDailyReward}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Est. Monthly Reward</span>
              <span>{userDailyReward * 30}</span>
            </div>
          </div>
          <Divider />
          <div className="flex column">
            <div className="flex justify-between">
              <span>Staked Tokens</span>
              <span>
                {new Intl.NumberFormat().format(stakedBalance)}
              </span>
            </div>
            <Input
              type="number"
              token
              value={inputAmount === null ? "" : inputAmount}
              maxInput={connected ? votingBalance : 0}
              disabled={!connected}
              onChange={(value: number) => setInputAmount(value)}
              submit={() => null}
            />
            <Button
              onClick={() => setShowStakeModal(true)}
              disabled={!connected && true}
            >
              Stake
            </Button>
            <StakeModal
              showModal={showStakeModal}
              stakeAmount={inputAmount ?? 0}
              setShowStakeModal={setShowStakeModal}
            />
            <Button
              onClick={() => setShowUnstakeModal(true)}
              disabled={!connected && true}
            >
              Unstake
            </Button>
            <UnstakeModal
              showModal={showUnstakeModal}
              unstakedAmount={inputAmount ?? 0}
              setInputAmount={setInputAmount}
              setShowUnstakeModal={setShowUnstakeModal}
            />
          </div>
        </div>
      </div>

      <div style={{ width: "100%" }}>
        <div className="flex justify-between header">
          <h2>{showing}</h2>
          <div className="filter-status">
            <span onClick={() => setShowing("active")}>Active</span>
            <span onClick={() => setShowing("inactive")}>Inactive</span>
            <span onClick={() => setShowing("passed")}>Passed</span>
            <span onClick={() => setShowing("rejected")}>Rejected</span>
            <span onClick={() => setShowing("all")}>All</span>
          </div>
        </div>

        <div className="show-proposals">
          {filteredProposals.map((proposal) => governance && (
            <ProposalCard
              proposal={proposal}
              governance={governance}
              key={proposal.pubkey.toBase58()}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
