import { useState, useEffect } from "react";
import { useProposal } from "../contexts/proposal";
import { ProposalCard } from "../components/ProposalCard";
import { Button, Divider, notification } from "antd";
import { useWallet } from "@solana/wallet-adapter-react";
import { useUser } from "../hooks/useClient";
import { Input } from "../components/Input";
import { makeAirdropTx } from "@jet-lab/jet-engine";
import { sendTransaction } from "../contexts/connection";
import { useConnection } from "../contexts/connection";
import { JET_FAUCET_DEVNET, JET_TOKEN_MINT_DEVNET } from "../utils/ids";
import { StakeModal } from "../components/modals/StakeModal";
import { UnstakeModal } from "../components/modals/UnstakeModal";
import { VotingBalanceModal } from "../components/modals/VotingBalanceModal";
import { InfoCircleOutlined } from "@ant-design/icons";
import { useAirdrop } from "../contexts/airdrop";

export const HomeView = () => {
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [showUnstakeModal, setShowUnstakeModal] = useState(false);
  const [showVotingBalanceModal, setShowVotingBalanceModal] = useState(false);

  const wallet = useWallet();
  const { connected, publicKey } = useWallet();
  const connection = useConnection();
  const { showing, setShowing, shownProposals } = useProposal();
  const [inputAmount, setInputAmount] = useState<number | null>(null);
  const { votingBalance, stakedBalance } = useUser();
  const { vestedAirdrops } = useAirdrop();

  // Devnet only: airdrop JET tokens
  const getAirdrop = async () => {
    if (!publicKey) {
      return alert("Connect your wallet!");
    }
    let transactionInstruction = await makeAirdropTx(
      JET_TOKEN_MINT_DEVNET,
      JET_FAUCET_DEVNET,
      publicKey,
      connection
    );
    await sendTransaction(connection, wallet, transactionInstruction, []);
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
          placement: 'bottomRight'
        })
    );
  };

  useEffect(() => openNotification(), []);

  return (
    <div className="content-body">
      <div className="panel">
        <h2>Your Info</h2>

        <div className="neu-inset" style={{ width: "260px" }}>
          <h3>Voting Balance</h3>
          <div className="text-gradient" id="staked-balance">
            {connected ? new Intl.NumberFormat().format(votingBalance) : 0} vJET
          </div>
          <div id="wallet-overview" className="flex justify-between column">
            <div className="flex justify-between">
              <span>Current Staking APR</span>
              <span>10%</span>
            </div>
            <div className="flex justify-between">
              <span>Est. Daily Reward</span>
              <span>10%</span>
            </div>
            <div className="flex justify-between">
              <span>Est. Monthly Reward</span>
              <span>10%</span>
            </div>
          </div>
          <Button onClick={getAirdrop}>GET JET</Button>
          <Divider />
          <div className="flex column">
            <div className="flex justify-between">
              <span>
                {new Intl.NumberFormat().format(stakedBalance)} JET available to
                unstake{" "}
                <InfoCircleOutlined
                  onClick={() => setShowVotingBalanceModal(true)}
                />
              </span>
              <VotingBalanceModal
                showModal={showVotingBalanceModal}
                setShowModal={setShowVotingBalanceModal}
              />
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
          {shownProposals.map((proposal: any) => (
            <ProposalCard
              headline={proposal.headline}
              number={proposal.id}
              id={proposal.id}
              active={proposal.active}
              end={proposal.end ?? null}
              result={proposal.result ?? null}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
