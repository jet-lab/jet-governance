import { PropsWithChildren, useState } from "react";
import { Modal, ModalProps } from "antd";
import { useRpcContext } from "../../hooks/useRpcContext";
import { withdrawUnbonded } from "../../actions/withdrawUnbonded";
import { useProposalContext } from "../../contexts/proposal";
import { isSignTransactionError } from "../../utils";
import { UnbondingAccount } from "@jet-lab/jet-engine";
import { notifyTransactionSuccess } from "../../tools/transactions";
import { useBlockExplorer } from "../../contexts/blockExplorer";

enum Steps {
  Confirm = 0,
  Error = 1,
  NothingToWithdraw = 2
}

interface WithdrawModalProps {
  onClose: () => void;
  unbondingAccount?: UnbondingAccount;
}

export const WithdrawModal = ({ onClose, unbondingAccount }: WithdrawModalProps) => {
  const rpcContext = useRpcContext();
  const [current, setCurrent] = useState<Steps>(Steps.Confirm);
  const [loading, setLoading] = useState(false);
  const { stakeAccount, unbondingAccounts, stakePool, refresh } = useProposalContext();
  const { getTxExplorerUrl } = useBlockExplorer();

  const unbondingAcc = unbondingAccount ? [unbondingAccount] : unbondingAccounts;
  const handleOk = () => {
    if (!stakeAccount || !stakePool || !unbondingAcc) {
      return;
    }
    if (unbondingAccounts && unbondingAccounts.length === 0) {
      return setCurrent(Steps.NothingToWithdraw);
    }
    setLoading(true);
    withdrawUnbonded(rpcContext, unbondingAcc, stakeAccount, stakePool)
      .then(txnSig => {
        if (txnSig !== undefined) {
          notifyTransactionSuccess(txnSig, "JET has been withdrawn!", getTxExplorerUrl(txnSig));
        }
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
        <p>To vote on proposals with these tokens, stake the tokens from your wallet again.</p>
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
  steps[Steps.NothingToWithdraw] = {
    title: "Nothing To Withdraw",
    okText: "Okay",
    onOk: () => onClose(),
    onCancel: () => onClose(),
    closable: true,
    cancelButtonProps: { style: { display: "none " } },
    children: <p>You don't have any tokens ready for you to withdraw. Come back later!</p>
  };

  return <Modal visible={true} {...steps[current]} />;
};
