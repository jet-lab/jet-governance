import { PropsWithChildren, useState } from "react";
import { Modal, ModalProps } from "antd";
import { useRpcContext } from "../../hooks/useRpcContext";
import { withdrawAllUnbonded } from "../../actions/withdrawUnbonded";
import { useProposalContext } from "../../contexts/proposal";
import { UnbondingAccount } from "@jet-lab/jet-engine";
import { toTokens } from "../../utils";

enum Steps {
  Confirm = 0,
  Success = 1,
  Error = 2,
  NothingToWithdraw = 3
}

export const WithdrawAllModal = ({
  visible,
  onClose
}: {
  visible: boolean;
  onClose: () => void;
}) => {
  const rpcContext = useRpcContext();
  const [current, setCurrent] = useState<Steps>(Steps.Confirm);
  const [loading, setLoading] = useState(false);
  const { stakeAccount, unbondingAccounts, jetMint, stakePool, refresh } = useProposalContext();

  const stakeAmount = toTokens(
    UnbondingAccount.useUnbondingAmountTotal(unbondingAccounts).unbondingComplete,
    jetMint
  );

  const handleOk = () => {
    if (!stakeAccount || !stakePool || !unbondingAccounts) {
      return;
    }
    if (unbondingAccounts.length === 0) {
      return setCurrent(Steps.NothingToWithdraw);
    }
    setLoading(true);
    withdrawAllUnbonded(rpcContext, unbondingAccounts, stakeAccount, stakePool)
      .then(() => {
        setCurrent(Steps.Success);
      })
      .catch(() => {
        setCurrent(Steps.Error);
      })
      .finally(() => {
        setLoading(false);
        refresh();
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
        <p>Choosing to withdraw will return your governance tokens to your wallet.</p>

        <p>Withdrawn governance tokens will not be able to vote on proposals.</p>
      </>
    )
  };
  steps[Steps.Success] = {
    title: `All set!`,
    okText: "I understand.",
    onOk: () => handleClose(),
    onCancel: () => handleClose(),
    closable: true,
    cancelButtonProps: { style: { display: "none " } },
    children: <p>You've withdrawn {stakeAmount} JET from JetGovern.</p>
  };
  steps[Steps.Error] = {
    title: "Error",
    okText: "I understand.",
    onOk: () => handleClose(),
    onCancel: () => handleClose(),
    closable: true,
    cancelButtonProps: { style: { display: "none " } },
    children: <p>We have encountered an unknown error, please try again.</p>
  };
  steps[Steps.NothingToWithdraw] = {
    title: "Nothing To Withdraw",
    okText: "Okay",
    onOk: () => handleClose(),
    onCancel: () => handleClose(),
    closable: true,
    cancelButtonProps: { style: { display: "none " } },
    children: <p>You don't have any tokens ready for you to withdraw. Come back later!</p>
  };

  return <Modal visible={visible} {...steps[current]} />;
};
