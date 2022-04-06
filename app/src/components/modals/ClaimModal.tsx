import { Modal, ModalProps } from "antd";
import { PropsWithChildren, useState } from "react";
import { Link } from "react-router-dom";
import { Airdrop } from "@jet-lab/jet-engine";
import { useRpcContext } from "../../hooks/useRpcContext";
import { useProposalContext } from "../../contexts/proposal";
import { claimAndStake } from "../../actions/claimAndStake";
import { DocsLink } from "../docsLink";
import { isSignTransactionError } from "../../utils";
import { useWallet } from "@solana/wallet-adapter-react";
import { useBlockExplorer } from "../../contexts/blockExplorer";

enum Steps {
  Confirm = 0,
  Success = 1,
  Error = 2
}

export const ClaimModal = ({
  stakeAmount,
  airdrop,
  onClose
}: {
  stakeAmount: number | undefined;
  airdrop: Airdrop | undefined;
  onClose: () => void;
}) => {
  const { publicKey } = useWallet();
  const rpcContext = useRpcContext();
  const [current, setCurrent] = useState<Steps>(Steps.Confirm);
  const [loading, setLoading] = useState(false);
  const { programs, stakePool, stakeAccount, realm, refresh } = useProposalContext();
  const { getTxExplorerUrl } = useBlockExplorer();

  const handleOk = () => {
    if (!stakeAmount || !airdrop) {
      return;
    }

    setLoading(true);
    if (!!programs && !!airdrop && !!stakePool && !!stakeAccount && !!publicKey && !!realm) {
      claimAndStake(
        rpcContext,
        programs.rewards,
        airdrop,
        stakePool,
        stakeAccount,
        publicKey,
        realm,
        getTxExplorerUrl
      )
        .then(() => {
          setCurrent(Steps.Success);
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
    }
  };

  const steps: PropsWithChildren<ModalProps>[] = [];

  steps[Steps.Confirm] = {
    title: `Confirm you'd like to claim airdrop`,
    okText: "Claim and Stake",
    onOk: () => handleOk(),
    onCancel: () => onClose(),
    closable: true,
    okButtonProps: { loading },
    children: (
      <div className="flex column">
        <p>
          You are claiming <b>{stakeAmount} JET</b>.
        </p>
        <p>
          Your tokens will be automatically staked into Jet Govern, rewards will begin accruing, and
          you can vote on active proposals.
        </p>
        <p>
          You may unstake at anytime, but before the tokens can be withdrawn to your wallet, there
          is a 29.5-day unbonding period. Please <DocsLink>read the docs</DocsLink> for more
          information.
        </p>
      </div>
    )
  };

  steps[Steps.Success] = {
    title: "Congratulations and welcome aboard!",
    okText: "Okay",
    onOk: () => onClose(),
    onCancel: () => onClose(),
    closable: false,
    cancelButtonProps: { style: { display: "none " } },
    children: (
      <div className="flex column">
        <p>
          You've claimed and staked <b>{stakeAmount} JET</b>.
        </p>

        <p>
          Head on back to the <Link to="/">dashboard page</Link> to see your staked balance and vote
          on active proposals!
        </p>
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
    children: <p>We have encountered an unknown error</p>
  };

  return <Modal visible={true} {...steps[current]} />;
};
