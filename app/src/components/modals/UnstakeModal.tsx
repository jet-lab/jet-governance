import { bnToNumber } from "@jet-lab/jet-engine";
import { Modal, ModalProps } from "antd";
import BN from "bn.js";
import { ReactNode, useState } from "react";
import { rescindAndUnstake } from "../../actions/rescindAndUnstake";
import { useProposalContext } from "../../contexts";
import { useRpcContext } from "../../hooks";
import { dateToString, isSignTransactionError } from "../../utils";
import { useBlockExplorer } from "../../contexts/blockExplorer";
import { notifyTransactionSuccess } from "../../tools/transactions";
import { REWARDS_ENABLED } from "../../constants";
import { DocsLink } from "../docsLink";

enum Steps {
  Confirm = 0,
  Error = 1
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
    jetMint,

    realm,
    governance,
    walletVoteRecords,

    programs
  } = useProposalContext();
  const rpcContext = useRpcContext();

  const [current, setCurrent] = useState(Steps.Confirm);
  const [loading, setLoading] = useState(false);
  const { getTxExplorerUrl } = useBlockExplorer();

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
      !realm ||
      !governance ||
      !jetMint
    ) {
      return;
    }

    const unstakeAmount = new BN(amount * 10 ** jetMint.decimals);
    setLoading(true);
    rescindAndUnstake(rpcContext, stakePool, stakeAccount, governance, unstakeAmount)
      .then(txnSig => {
        notifyTransactionSuccess(
          txnSig,
          "JET has begun unbonding for 29.5 days!",
          getTxExplorerUrl
        );
        setLoading(false);
        setDisplayUnbondDate();
        resetInput();
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
            Remember, when you unstake ANY amount of jet tokens,
            <b>you lose ALL previously cast votes on currently active proposals.</b>
            You will need to recast your votes on proposals with remaning JET after this unstaking
            if you want your vote to count on those proposals.
          </p>
        )}
        {REWARDS_ENABLED ? (
          <p>
            Unstaked tokens have a 29.5-day unbonding period. During this period, you will not earn
            any rewards.
          </p>
        ) : (
          <p>Unstaked tokens have a 29.5-day unbonding period.</p>
        )}
        <p>
          Your flight log will reflect a status of unbonding until this period has completed. You
          can view detailed information about your token availability by visiting the Flight Logs
          page. For more information, please visit our <DocsLink>docs</DocsLink>.
        </p>
        <div className="emphasis">
          {REWARDS_ENABLED ? (
            <p>
              To continue voting and earning rewards with these tokens, you may restake on the
              Flight Logs page at any point during the unbonding period.
            </p>
          ) : (
            <p>
              To continue voting with these tokens, you may restake on the Flight Logs page at any
              point during the unbonding period.
            </p>
          )}
        </div>
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
