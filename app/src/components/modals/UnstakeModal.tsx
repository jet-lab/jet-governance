import { ReactNode, useState } from "react";
import { Modal, ModalProps } from "antd";
import { useProposalContext } from "../../contexts/proposal";
import { rescindAndUnstake } from "../../actions/rescindAndUnstake";
import { useRpcContext } from "../../hooks/useRpcContext";
import { dateToString } from "../../utils";
import { bnToNumber } from "@jet-lab/jet-engine";
import { isSignTransactionError } from "../../utils";
import { BN } from "@project-serum/anchor";

enum Steps {
  Confirm = 0,
  Success = 1,
  Error = 2
}

export const UnstakeModal = ({
  onClose,
  resetInput,
  amount
}: {
  onClose: () => void;
  resetInput: () => void;
  amount: number | null;
}) => {
  const {
    refresh,

    stakePool,
    stakeAccount,
    voteMint,

    governance,
    tokenOwnerRecord,
    walletVoteRecords,

    programs
  } = useProposalContext();
  const rpcContext = useRpcContext();

  const [current, setCurrent] = useState(Steps.Confirm);
  const [loading, setLoading] = useState(false);

  const unrelinquishedVoteRecords = walletVoteRecords?.filter(
    voteRecord => !voteRecord.account.isRelinquished
  );

  const [unbondDate, setUnbondDate] = useState("");
  const setDisplayUnbondDate = () => {
    stakePool &&
      setUnbondDate(
        dateToString(new Date(Date.now() + bnToNumber(stakePool.stakePool.unbondPeriod) * 1000))
      );
  };

  const handleSubmitUnstake = () => {
    if (
      amount === null ||
      !programs ||
      !stakePool ||
      !stakeAccount ||
      !governance ||
      !tokenOwnerRecord ||
      !voteMint
    ) {
      return;
    }

    const unstakeAmount = new BN(amount * 10 ** voteMint.decimals);
    setLoading(true);
    rescindAndUnstake(
      rpcContext,
      stakePool,
      stakeAccount,
      governance,
      tokenOwnerRecord,
      unstakeAmount
    )
      .then(() => {
        setLoading(false);
        setDisplayUnbondDate();
        setCurrent(Steps.Success);
        resetInput();
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

  const steps: (ModalProps & { content: ReactNode })[] = [];
  steps[Steps.Confirm] = {
    title: `You're unstaking ${
      amount && Intl.NumberFormat("us-US").format(amount)
    } JET from the platform.`,
    okText: "Confirm unstake",
    okButtonProps: { loading },
    onOk: () => handleSubmitUnstake(),
    onCancel: () => onClose(),
    closable: true,
    content: (
      <div className="flex column">
        {unrelinquishedVoteRecords && unrelinquishedVoteRecords.length !== 0 && (
          <p>
            You currently have votes cast on active proposals, which will be rescinded upon
            unbonding. If you wish to keep your votes, wait until the voting period has ended before
            unstaking.
          </p>
        )}
        <p>
          Unstaked tokens have a 29.5-day unbonding period. During this period, you will not earn
          any rewards.
        </p>
        <p>
          Your flight log will reflect a status of unbonding until this period has completed. You
          can view detailed information about your token availability by visiting the Flight Logs
          page.
        </p>
        <div className="emphasis">
          <p>
            To continue voting and earning rewards with these tokens, you may restake on the Flight
            Logs page at any point during the unbonding period.
          </p>
        </div>
      </div>
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
      <div className="flex column">
        <p>
          You've unstaked {amount && Intl.NumberFormat("us-US").format(amount)} JET from JetGovern.
        </p>
        <p>Your 29.5-day unbonding period will complete on {unbondDate}.</p>
      </div>
    )
  };
  steps[Steps.Error] = {
    title: "Oops! Something went wrong",
    okText: "Okay",
    onOk: () => onClose(),
    onCancel: () => onClose(),
    closable: true,
    cancelButtonProps: { style: { display: "none" } },
    content: <p>Well that was embarassing. We've encountered an unknown error, please try again.</p>
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
