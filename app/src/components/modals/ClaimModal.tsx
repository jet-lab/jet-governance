import { Modal, ModalProps } from 'antd';
import { PropsWithChildren, useState } from 'react';

enum Steps {
  AirdropReceived = 0,
  Error = 1,
}

export const ClaimModal = ({
  visible,
  stakeAmount,
  setShowModal,
}: {
  visible: boolean;
  stakeAmount: number | undefined;
  setShowModal: Function;
}) => {
  const [current, setCurrent] = useState<Steps>(Steps.AirdropReceived);

  // TODO - question: how to set error state when passing as prop?
  // how to pass as a catch here?
  const handleOk = () => {
    setShowModal(false);
  };
  const handleCancel = () => {
    setShowModal(false);
  };

  const steps: PropsWithChildren<ModalProps>[] = [];

  steps[Steps.AirdropReceived] = {
    title: 'Congratulations and welcome aboard!',
    okText: 'Okay',
    onOk: () => handleOk(),
    onCancel: () => handleCancel(),
    closable: false,
    cancelButtonProps: { style: { display: 'none ' } },
    children: (
      <>
        <p>
          You've claimed and staked <b>{stakeAmount} JET</b>.
        </p>

        <p>
          Your tokens have been automatically staked into Jet Govern, rewards
          will begin accruing, and you can vote on active proposals.
        </p>
        <p>
          You may unstake at anytime, but before the tokens can be withdrawn to
          your wallet, there is a 29.5-day unbonding period. Please read{' '}
          <a href='https://docs.jetprotocol.io/jet-protocol/protocol/jet-staking'>
            the docs
          </a>{' '}
          for more information.
        </p>
      </>
    ),
  };

  steps[Steps.Error] = {
    title: 'Error ',
    okText: 'Okay',
    onOk: () => handleCancel(),
    onCancel: () => handleCancel(),
    closable: true,
    cancelButtonProps: { style: { display: 'none ' } },
    children: <p>We have encountered an unknown error</p>,
  };

  return <Modal visible={visible} {...steps[current]} />;
};
