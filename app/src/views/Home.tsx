import React, { useState } from "react";
import { useProposal } from "../contexts/proposal";
import { ProposalCard } from "../components/ProposalCard";
import { Button, Divider } from "antd";
import { useWallet } from "@solana/wallet-adapter-react";
import { shortenAddress, formatTokenAmount } from "../utils/utils";
import { useUser, proposals } from "../hooks/useClient";
import { Input } from "../components/Input";
import { makeAirdropTx } from "@jet-lab/jet-engine";
import { sendTransaction } from "../contexts/connection";
import { useConnection } from "../contexts/connection";
import { JET_FAUCET_DEVNET, JET_TOKEN_MINT_DEVNET } from "../utils/ids";
import { StakeModal } from "../components/modals/StakeModal";
import { UnstakeModal } from "../components/modals/UnstakeModal";

export const HomeView = () => {
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [showUnstakeModal, setShowUnstakeModal] = useState(false);

  const wallet = useWallet();
  const { connected, publicKey } = useWallet();
  const connection = useConnection();
  const { showing, setShowing, shownProposals } = useProposal();
  const [inputAmount, setInputAmount] = useState<number | null>(null);
  const { jetBalance, locked } = useUser();

  const inputCheck = (value: number) => {
    if (value && value < 0) {
      value = 0;
    }
  };

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

  return (
    <div className="content-body">
      <div className="panel">
        <h3>Your Info</h3>

        <div className="neu-inset" style={{ width: "260px" }}>
          <h3>Voting Balance</h3>
          <div className="text-gradient" id="locked-balance">
            {connected ? jetBalance.balance : 0} JET
          </div>
          <div id="wallet-overview" className="flex justify-between column">
            <div className="flex justify-between">
              <span >Current Staking APR</span>
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
              <span>Staked Tokens</span>
              <span>{locked}</span>
            </div>
            <Input
              type="number"
              token
              value={inputAmount === null ? "" : inputAmount}
              maxInput={connected ? jetBalance.balance : 0}
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
              setShowStakeModal={setShowStakeModal}
            />
          </div>
        </div>
      </div>

      <div className="panel" style={{ width: "100%" }}>
        <div className="flex justify-between header">
          <h3>{showing}</h3>
          <div>
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
