import { useState } from "react";
import { Modal } from "antd";
import { explorerUrl } from "../../utils";
import { StakeAccount } from "@jet-lab/jet-engine";
import { useWallet } from "@solana/wallet-adapter-react";
import { useProposalContext } from "../../contexts/proposal";
import { useBN } from "../../hooks/useStaking";
import React from "react";

export const StakeModal = (props: {
  showModal: boolean;
  onClose: () => void;
  amount: number | undefined;
}) => {
  const {
    showModal,
    onClose,
    amount,
  } = props;

  const [showSuccessfulModal, setShowSuccessfulModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const { publicKey } = useWallet();
  const {
    stakeProgram,
    stakePool,
    stakeAccount,
    jetAccount,
    voteAccount,
  } = useProposalContext()
  const stakeLamports = useBN(amount, stakePool?.collateralMint.decimals)
  // Handlers for staking info modal

  const handleSubmitTx = () => {
    console.log(stakePool, publicKey, jetAccount)
    if (!stakePool || !publicKey || !jetAccount) {
      return;
    }

    setSubmitLoading(true);
    console.log("foo")
    StakeAccount.addStake(stakePool, publicKey, jetAccount.address, stakeLamports)
      .then(txid => { console.log(txid); setSubmitLoading(false); onClose(); setShowSuccessfulModal(true) })
      .catch(err => { console.error(err); setSubmitLoading(false); onClose(); setShowErrorModal(true) })
  };

  const handleCancel = () => {
    onClose();
    setShowSuccessfulModal(false);
  };

  // Handlers for Tx successful modal
  const handleOk = () => {
    setShowSuccessfulModal(false);
  };

  return (
    <>
      <Modal
        title={`You are staking ${amount && Intl.NumberFormat('us-US').format(amount)} JET into the platform.`}
        visible={showModal}
        okText="I understand."
        onOk={handleSubmitTx}
        okButtonProps={{loading: submitLoading}}
        onCancel={handleCancel}
        cancelButtonProps={{ style: { display: "none " } }}
      >
        <p>Staking tokens yields X% APR.</p>

        {/* <p>APR = 365 *  (total_daily_reward / total stake)</p> */}

        <p>
          Please note: All staked tokens require a 29.5-day unbonding period,
          which begins when you unstake your tokens.
        </p>

        <p>
          Staked tokens will continue to earn staking rewards during the unbonding period.
        </p>
      </Modal>

      <Modal
        title={`Transaction successful`}
        visible={showSuccessfulModal}
        okText="Okay"
        onOk={handleOk}
        onCancel={handleCancel}
        cancelButtonProps={{ style: { display: "none " } }}
      >
        <p>
          You've staked <strong>{amount && Intl.NumberFormat('us-US').format(amount)} JET</strong> into Jet Govern and can begin voting with it immediately.
        </p>

        <p>View your transaction on the blockchain <a href={explorerUrl('string')} target="_blank" rel="noopener noreferrer">here</a>.</p>
      </Modal>
    </>
  );
};
