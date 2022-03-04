import { ReactNode, useState } from "react";
import { Modal, ModalProps } from "antd";
import { useWallet } from "@solana/wallet-adapter-react";
import { useProposalContext } from "../../contexts/proposal";
import { addStake } from "../../actions/addStake";
import { useRpcContext } from "../../hooks/useRpcContext";
import { PublicKey } from "@solana/web3.js";
import { useBN } from "../../hooks";

enum Steps {
  Start = 0,
  Success = 1,
  Error = 2
}

export const StakeModal = (props: {
  visible: boolean;
  onClose: () => void;
  amount: number | undefined;
  realm: PublicKey;
}) => {
  const { visible, onClose, amount, realm } = props;

  const [current, setCurrent] = useState<Steps>(Steps.Start);
  const [loading, setLoading] = useState(false);
  const { publicKey } = useWallet();
  const { stakePool, jetAccount } = useProposalContext();
  const rpcContext = useRpcContext();
  const stakeLamports = useBN(amount, stakePool?.collateralMint.decimals);
  // Handlers for staking info modal

  const handleSubmitTx = () => {
    if (!stakePool || !publicKey || !jetAccount) {
      return;
    }

    setLoading(true);
    addStake(rpcContext, realm, stakePool, publicKey, stakeLamports)
      .then(() => {
        setLoading(false);
        setCurrent(Steps.Success);
      })
      .catch((err: any) => {
        console.error(err);
        setLoading(false);
        setCurrent(Steps.Error);
      });
  };

  const steps: (ModalProps & { content: ReactNode })[] = [];
  steps[Steps.Start] = {
    title: `You are staking ${
      amount && Intl.NumberFormat("us-US").format(amount)
    } JET into the platform.`,
    okText: "I understand.",
    onOk: () => handleSubmitTx(),
    onCancel: () => onClose(),
    okButtonProps: { loading: loading },
    closable: true,
    content: (
      <>
        <p>
          Staking tokens gives your voice a vote and entitles you to rewards sourced from protocol
          revenue.
        </p>
        <p>
          Remember: To unstake your tokens, there will be a 29.5-day unbonding period. For more
          information, please <a>read the docs</a>.
        </p>
      </>
    )
  };
  steps[Steps.Success] = {
    title: `All set!`,
    okText: "Okay",
    onOk: () => onClose(),
    onCancel: () => onClose(),
    closable: true,
    cancelButtonProps: { style: { display: "none" } },
    content: (
      <>
        <p>
          You've staked {amount && Intl.NumberFormat("us-US").format(amount)}
          JET into JetGovern and can begin using to vote on active proposals immediately.
        </p>
        <p>Please refresh your page to see your update balance.</p>
      </>
    )
  };
  steps[Steps.Error] = {
    title: `Error.`,
    okText: "I understand.",
    onOk: () => onClose(),
    onCancel: () => onClose(),
    content: <p>We have encountered an unknown error.</p>,
    closable: true
  };

  return (
    <Modal
      title={steps[current].title}
      visible={visible}
      okText={steps[current].okText}
      onOk={steps[current].onOk}
      okButtonProps={steps[current].okButtonProps}
      onCancel={steps[current].onCancel}
      closable={steps[current].closable}
      cancelButtonProps={{ style: { display: "none " } }}
    >
      {steps[current].content}
    </Modal>
  );
};
