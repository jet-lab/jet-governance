import { useState } from "react";
import { Modal } from "antd";
import { explorerUrl } from "../../utils";
import { StakeAccount } from "@jet-lab/jet-engine";
import { useWallet } from "@solana/wallet-adapter-react";
import { useProposalContext } from "../../contexts/proposal";
import { useBN } from "../../hooks/useStaking";
import React from "react";

export const StakeModal = (props: {
  visible: boolean;
  onClose: () => void;
  amount: number | undefined;
}) => {
  const { visible, onClose, amount } = props;

  const [current, setCurrent] = useState(0);
  const [submitLoading, setSubmitLoading] = useState(false);
  const { publicKey } = useWallet();
  const { stakeProgram, stakePool, stakeAccount, jetAccount, voteAccount } =
    useProposalContext();
  const stakeLamports = useBN(amount, stakePool?.collateralMint.decimals);
  // Handlers for staking info modal

  const handleSubmitTx = () => {
    console.log(stakePool, publicKey, jetAccount);
    if (!stakePool || !publicKey || !jetAccount) {
      return;
    }

    setSubmitLoading(true);
    console.log("foo");
    StakeAccount.addStake(
      stakePool,
      publicKey,
      jetAccount.address,
      stakeLamports
    )
      .then((txid) => {
        console.log(txid);
        setSubmitLoading(false);
        setCurrent(1);
      })
      .catch((err) => {
        console.error(err);
        setSubmitLoading(false);
        setCurrent(2);
      });
  };

  const steps = [
    {
      title: `You are staking ${
        amount && Intl.NumberFormat("us-US").format(amount)
      } JET into the platform.`,
      okText: "I understand.",
      onOk: () => handleSubmitTx(),
      onCancel: () => onClose(),
      okButtonProps: { loading: submitLoading },
      content: [
        <>
          <p>
            Staking tokens gives your voice a vote and entitles you to rewards
            sourced from protocol revenue.
          </p>
          <p>
            Remember: To unstake your tokens, there will be a 29.5-day unbonding
            period. For more information, please <a>read the docs.</a>
          </p>
        </>
      ],
      closable: true,
      cancelButtonProps: undefined,
    },
    {
      title: `All set!`,
      okText: "Okay",
      onOk: () => onClose(),
      onCancel: () => onClose(),
      okButtonProps: { loading: submitLoading },
      content: [
        <p>You've staked {
        amount && Intl.NumberFormat("us-US").format(amount)
        } JET into JetGovern and can begin using to vote on active proposals immediately.</p>
      ],
      closable: true,
      cancelButtonProps: { display: "none " },
    },
    {
      title: `Error.`,
      okText: "I understand.",
      onOk: () => onClose(),
      onCancel: () => onClose(),
      okButtonProps: { loading: submitLoading },
      content: `Staking tokens yields X% APR.`,
      closable: true,
      cancelButtonProps: undefined,
    },
  ];

  return (
    <Modal
      title={steps[current].title}
      visible={visible}
      okText={steps[current].okText}
      onOk={steps[current].onOk}
      okButtonProps={steps[current].okButtonProps}
      onCancel={steps[current].onCancel}
      cancelButtonProps={{ style: steps[current].cancelButtonProps }}
    >
      {steps[current].content}
    </Modal>
  );
};
