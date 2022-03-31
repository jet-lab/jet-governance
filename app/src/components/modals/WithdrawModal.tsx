import { UnbondingAccount } from "@jet-lab/jet-engine";
import { Modal, ModalProps } from "antd";
import { PropsWithChildren, useState } from "react";
import { withdrawUnbonded } from "../../actions/withdrawUnbonded";
import { useProposalContext } from "../../contexts";
import { useRpcContext } from "../../hooks";
import { fromLamports, isSignTransactionError } from "../../utils";

enum Steps {
  Confirm = 0,
  Error = 1
}

export const WithdrawModal = ({
  onClose,
  unbondingAccount
}: {
  onClose: () => void;
  unbondingAccount: UnbondingAccount | undefined;
}) => {
  const rpcContext = useRpcContext();
  const [current, setCurrent] = useState<Steps>(Steps.Confirm);
  const [loading, setLoading] = useState(false);
  const { stakeAccount, jetMint, stakePool, refresh } = useProposalContext();

  const stakeAmount = fromLamports(unbondingAccount?.tokens, jetMint);

  const handleOk = () => {
    if (!unbondingAccount || !stakeAccount || !stakePool) {
      return;
    }

    setLoading(true);
    withdrawUnbonded(rpcContext, unbondingAccount, stakeAccount, stakePool)
      .then(() => {
        onClose();
      })
      .catch(err => {
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
  const steps: PropsWithChildren<ModalProps>[] = [];

  steps[Steps.Confirm] = {
    title: `Confirm you'd like to withdraw?`,
    okText: "I understand",
    onOk: () => handleOk(),
    onCancel: () => onClose(),
    closable: true,
    okButtonProps: { loading },
    children: (
      <div className="flex column">
        <p>Choosing to withdraw will return your governance tokens to your wallet.</p>
        <p>Withdrawn governance tokens will not be able to vote on proposals.</p>
      </div>
    )
  };
  steps[Steps.Error] = {
    title: "Error",
    okText: "Okay",
    onOk: () => onClose(),
    onCancel: () => onClose(),
    closable: true,
    cancelButtonProps: { style: { display: "none " } },
    children: <p>We have encountered an unknown error, please try again.</p>
  };

  return <Modal visible={true} {...steps[current]} />;
};
