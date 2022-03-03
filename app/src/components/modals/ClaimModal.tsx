import { Modal, ModalProps } from 'antd';
import { PropsWithChildren, useState } from 'react';
import { Link } from 'react-router-dom';
import { Airdrop } from '@jet-lab/jet-engine';
import { useRpcContext } from '../../hooks/useRpcContext';
import { useProposalContext } from '../../contexts/proposal';
import { claimAndStake } from '../../actions/claimAndStake';

enum Steps {
  Confirm = 0,
  Success = 1,
  Error = 2
}

export const ClaimModal = ({
  visible,
  stakeAmount,
  airdrop,
  onClose
}: {
  visible: boolean;
  stakeAmount: number | undefined;
  airdrop: Airdrop | undefined;
  onClose: () => void;
}) => {
  const rpcContext = useRpcContext();
  const [current, setCurrent] = useState<Steps>(Steps.Confirm);
  const [loading, setLoading] = useState(false);
  const { rewardsProgram, stakePool, stakeAccount } = useProposalContext();

  const handleOk = () => {
    if (!stakeAmount || !airdrop) {
      return;
    }

    setLoading(true);
    if (!!rewardsProgram && !!airdrop && !!stakePool && !!stakeAccount) {
      claimAndStake(rpcContext, rewardsProgram, airdrop, stakePool, stakeAccount)
        .then(() => {
          setCurrent(Steps.Success);
        })
        .catch(() => {
          setCurrent(Steps.Error);
        })
        .then(() => {
          setLoading(false);
        });
    }
  };

  const handleCancel = () => {
    setCurrent(Steps.Confirm);
    onClose();
  };

  const handleCloseAndRefresh = () => {
    handleCancel();
    window.location.reload();
  };

  const steps: PropsWithChildren<ModalProps>[] = [];

  steps[Steps.Confirm] = {
    title: `Confirm you'd like to claim airdrop`,
    okText: 'Claim and Stake',
    onOk: () => handleOk(),
    onCancel: () => handleCancel(),
    closable: true,
    okButtonProps: { loading },
    children: (
      <>
        <p>
          You are claiming <b>{stakeAmount} JET</b>.
        </p>
        <p>
          Your tokens will be automatically staked into Jet Govern, rewards will begin accruing, and
          you can vote on active proposals.
        </p>
        <p>
          You may unstake at anytime, but before the tokens can be withdrawn to your wallet, there
          is a 29.5-day unbonding period. Please read{' '}
          <a href="https://docs.jetprotocol.io/jet-protocol/protocol/jet-staking">the docs</a> for
          more information.
        </p>
      </>
    )
  };

  steps[Steps.Success] = {
    title: 'Congratulations and welcome aboard!',
    okText: 'Okay',
    onOk: () => handleCloseAndRefresh(),
    onCancel: () => handleCancel(),
    closable: false,
    cancelButtonProps: { style: { display: 'none ' } },
    children: (
      <>
        <p>
          You've claimed and staked <b>{stakeAmount} JET</b>.
        </p>

        <p>
          Head on back to the <Link to="/">dashboard page</Link> to see your staked balance and vote
          on active proposals!
        </p>
      </>
    )
  };
  steps[Steps.Error] = {
    title: 'Error ',
    okText: 'Okay',
    onOk: () => handleCancel(),
    onCancel: () => handleCancel(),
    closable: true,
    cancelButtonProps: { style: { display: 'none ' } },
    children: <p>We have encountered an unknown error</p>
  };

  return <Modal visible={visible} {...steps[current]} />;
};
