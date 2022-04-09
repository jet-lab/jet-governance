import { ProgramAccount, Realm } from "@solana/spl-governance";
import { useWallet } from "@solana/wallet-adapter-react";
import { Modal, ModalProps } from "antd";
import { ReactNode, useState } from "react";
import { DocsLink } from "../docsLink";
import { addStake } from "../../actions/addStake";
import { useProposalContext } from "../../contexts";
import { useBN, useRpcContext } from "../../hooks";
import { isSignTransactionError } from "../../utils";

enum Steps {
  Confirm = 0,
  Error = 1
}

export const StakeModal = ({
  onClose,
  amount,
  realm
}: {
  onClose: () => void;
  amount: number | undefined;
  realm: ProgramAccount<Realm> | undefined;
}) => {
  const { jetMint, governance, programs, stakeAccount } = useProposalContext();
  const [current, setCurrent] = useState<Steps>(Steps.Confirm);
  const [loading, setLoading] = useState(false);
  const { publicKey } = useWallet();
  const { stakePool, jetAccount, refresh } = useProposalContext();
  const rpcContext = useRpcContext();
  const stakeLamports = useBN(amount, stakePool?.collateralMint.decimals);
  // Handlers for staking info modal

  const handleSubmitTx = () => {
    if (!stakePool || !realm || !publicKey || !jetAccount || !governance || !programs) {
      return;
    }

    setLoading(true);
    addStake(
      rpcContext,
      stakePool,
      publicKey,
      stakeLamports,
      jetMint,
      governance,
      programs.stake,
      stakeAccount
    )
      .then(() => {
        onClose();
      })
      .catch((err: any) => {
        if (isSignTransactionError(err)) {
          onClose();
        } else {
          console.log(err);
          setCurrent(Steps.Error);
        }
      })
      .finally(() => {
        setLoading(false);
        refresh();
      });
  };

  const steps: (ModalProps & { content: ReactNode })[] = [];
  steps[Steps.Confirm] = {
    title: `You are staking ${
      amount && Intl.NumberFormat("us-US").format(amount)
    } JET into the platform.`,
    okText: "I understand",
    onOk: () => handleSubmitTx(),
    onCancel: () => onClose(),
    okButtonProps: { loading: loading },
    closable: true,
    content: (
      <div className="flex column">
        <p>
          Staking tokens gives your voice a vote and entitles you to rewards sourced from protocol
          revenue.
        </p>
        <p>
          Remember: To unstake your tokens, there will be a 29.5-day unbonding period. For more
          information, please <DocsLink>read the docs</DocsLink>.
        </p>
      </div>
    )
  };
  steps[Steps.Error] = {
    title: `Error.`,
    okText: "Okay",
    onOk: () => onClose(),
    onCancel: () => onClose(),
    content: <p>We have encountered an unknown error.</p>,
    closable: true
  };

  return (
    <Modal
      title={steps[current].title}
      visible={true}
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
