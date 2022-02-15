import { PropsWithChildren, useState } from "react";
import { Modal, ModalProps } from "antd";
import { useRpcContext } from "../../hooks/useRpcContext";
import { UnbondingAccount } from "@jet-lab/jet-engine";
import { fromLamports } from "../../utils";
import { withdrawUnbonded } from "../../actions/withdrawUnbonded";
import { useProposalContext } from "../../contexts/proposal";

enum Steps {
  Confirm = 0,
  Success = 1,
  Error = 2,
}

export const WithdrawModal = ({
  visible,
  onClose,
  unbondingAccount,
}: {
  visible: boolean;
  onClose: () => void;
  unbondingAccount: UnbondingAccount | undefined;
}) => {
  const rpcContext = useRpcContext();
  const [current, setCurrent] = useState<Steps>(Steps.Confirm);
  const [loading, setLoading] = useState(false);
  const { stakeAccount, jetMint, stakePool } = useProposalContext();
  
  const stakeAmount = fromLamports(
    unbondingAccount?.unbondingAccount.amount.tokens,
    jetMint
  );

  const handleOk = () => {
    if (!unbondingAccount || !stakeAccount || !stakePool) {
      return;
    }

    setLoading(true);
    withdrawUnbonded(rpcContext, unbondingAccount, stakeAccount, stakePool)
      .then(() => {
        setCurrent(Steps.Success);
      })
      .catch(() => {
        setCurrent(Steps.Error);
      })
      .then(() => {
        setLoading(false);
      });
  };

  const handleClose = () => {
    setCurrent(Steps.Confirm);
    onClose();
  };

  const steps: PropsWithChildren<ModalProps>[] = [];

  steps[Steps.Confirm] = {
    title: `Confirm you'd like to withdraw?`,
    okText: "I understand.",
    onOk: () => handleOk(),
    onCancel: () => handleClose(),
    closable: true,
    okButtonProps: { loading },
    children: (
      <>
        <p>
          Choosing to withdraw will return your governance tokens to your
          wallet.
        </p>

        <p>
          Withdrawn governance tokens will not be able to vote on proposals.
        </p>
      </>
    ),
  };
  steps[Steps.Success] = {
    title: `All set!`,
    okText: "I understand.",
    onOk: () => handleClose(),
    onCancel: () => handleClose(),
    closable: true,
    cancelButtonProps: { style: { display: "none " } },
    children: (
      <>
        <p>
          You've withdrawn {Intl.NumberFormat("us-US").format(stakeAmount)} JET
          from JetGovern.
        </p>
        <p>Please refresh your page to see your update balance.</p>
      </>
    ),
  };
  steps[Steps.Error] = {
    title: "Error",
    okText: "I understand.",
    onOk: () => setCurrent(Steps.Confirm),
    onCancel: () => handleClose(),
    closable: true,
    cancelButtonProps: { style: { display: "none " } },
    children: <p>We have encountered an unknown error, please try again.</p>,
  };

  return <Modal visible={visible} {...steps[current]} />;
};