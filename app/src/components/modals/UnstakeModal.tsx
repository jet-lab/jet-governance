import { ReactNode, useMemo, useState } from "react";
import { Modal, ModalProps } from "antd";
import { useProposalContext } from "../../contexts/proposal";
import { rescindAndUnstake } from "../../actions/rescindAndUnstake";
import { BN } from "@project-serum/anchor";
import { useRpcContext } from "../../hooks/useRpcContext";

enum Steps {
  Start = 0,
  Success = 1,
}

export const UnstakeModal = ({
  visible,
  onClose,
  resetInput,
  amount,
}: {
  visible: boolean,
  onClose: () => void,
  resetInput: () => void,
  amount: number | null,
}) => {
  const {
    stakeProgram,
    stakePool,
    stakeAccount,
    voteMint,

    governance,
    tokenOwnerRecord,
    walletVoteRecords,
  } = useProposalContext();
  const rpcContext = useRpcContext();

  const [current, setCurrent] = useState(Steps.Start);
  const [loading, setLoading] = useState(false);

  const rescind = useMemo(() => {
    return walletVoteRecords.find(voteRecord => !voteRecord.account.isRelinquished);
  }, [walletVoteRecords])


  const handleSubmitUnstake = () => {
    if (amount === null || !stakeProgram || !stakePool || !stakeAccount || !governance || !tokenOwnerRecord || !voteMint) {
      return;
    }

    const unstakeAmount = new BN(amount * 10 ** voteMint.decimals);
    setLoading(true);
    rescindAndUnstake(
      rpcContext,
      stakeProgram,
      stakePool,
      stakeAccount,
      governance,
      tokenOwnerRecord,
      walletVoteRecords,
      unstakeAmount)
      .then(() => {
        setLoading(false)
        setCurrent(Steps.Success);
      })
      .catch(err => {
        console.log(err)
        setLoading(false)
        setCurrent(Steps.Start);
        resetInput()
        onClose()
      })
  };

  const handleCancel = () => {
    setCurrent(Steps.Start);
    onClose();
  };

  const steps: (ModalProps & { content: ReactNode })[] = []
  steps[Steps.Start] = {
    title: `You're unstaking ${amount && Intl.NumberFormat("us-US").format(amount)} JET from the platform.`,
    okText: "Confirm unstake",
    okButtonProps: { loading },
    onOk: () => handleSubmitUnstake(),
    onCancel: () => onClose(),
    closable: true,
    content:
      <>
        {rescind && <p>
          You currently have votes cast on active proposals, which will be rescinded upon unbonding. If you wish to keep your votes, wait until the voting period has ended before unstaking.
        </p>}
        <p>
          Unstaked tokens have a 29.5-day unbonding period. During this period, you will not earn any rewards.
          </p>
        <p>
          Your flight log will reflect a status of unbonding until this period has completed. You can view detailed information about your token availability by visiting the Flight Logs page.
        </p>
        <div className="emphasis">
          <p>
            To continue voting and earning rewards with these tokens, you may restake on the Flight Logs page at any point during the unbonding period.
          </p>
        </div>
      </>,
  }
  steps[Steps.Success] = {
    title: `All set!`,
    okText: "Okay",
    onOk: () => handleCancel(),
    onCancel: () => handleCancel(),
    closable: true,
    cancelButtonProps: { style: { display: "none" } },
    content:
      <>
        <p>
          You've unstaked {
            amount && Intl.NumberFormat("us-US").format(amount)
          } JET from JetGovern.
        </p>
        <p>
          Your 29.5-day unbonding period will complete on {new Date().toString()}.
        </p>
      </>,
  }

  return (
    <Modal
      visible={visible}
      {...steps[current]}
    />
  );
};
