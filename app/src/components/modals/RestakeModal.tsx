import { PropsWithChildren, useState } from 'react';
import { Modal, ModalProps } from 'antd';
import { restake } from '../../actions/restake';
import { useRpcContext } from '../../hooks/useRpcContext';
import { UnbondingAccount } from '@jet-lab/jet-engine';
import { fromLamports } from '../../utils';
import { useProposalContext } from '../../contexts/proposal';

enum Steps {
  Confirm = 0,
  Success = 1,
  Error = 2
}

export const RestakeModal = ({
  visible,
  onClose,
  unbondingAccount
}: {
  visible: boolean;
  onClose: () => void;
  unbondingAccount: UnbondingAccount | undefined;
}) => {
  const rpcContext = useRpcContext();
  const [current, setCurrent] = useState<Steps>(Steps.Confirm);
  const [loading, setLoading] = useState(false);
  const { stakeAccount, jetMint } = useProposalContext();

  const stakeAmount = fromLamports(unbondingAccount?.unbondingAccount.amount.tokens, jetMint);

  const handleOk = () => {
    if (!unbondingAccount || !stakeAccount) {
      return;
    }

    setLoading(true);
    restake(rpcContext, unbondingAccount, stakeAccount)
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

  const handleCloseAndRefresh = () => {
    handleClose();
    window.location.reload();
  };

  const steps: PropsWithChildren<ModalProps>[] = [];

  steps[Steps.Confirm] = {
    title: `Confirm you'd like to restake?`,
    okText: 'I understand.',
    onOk: () => handleOk(),
    onCancel: () => handleClose(),
    closable: true,
    okButtonProps: { loading },
    children: (
      <>
        <p>
          Choosing to restake will cancel your unstake transaction and you will immediately be able
          to vote and earn rewards with this amount.
        </p>

        <p>Votes that were rescinded when unstaking will not reactivate, and must be recast.</p>
      </>
    )
  };
  steps[Steps.Success] = {
    title: `All set!`,
    okText: 'I understand.',
    onOk: () => handleCloseAndRefresh(),
    onCancel: () => handleClose(),
    closable: true,
    cancelButtonProps: { style: { display: 'none ' } },
    children: (
      <>
        <p>
          You've restaked {Intl.NumberFormat('us-US').format(stakeAmount)} JET into JetGovern and
          can begin voting on active proposals immediately.
        </p>
        <p>Please refresh your page to see your update balance.</p>
      </>
    )
  };
  steps[Steps.Error] = {
    title: 'Error',
    okText: 'I understand.',
    onOk: () => setCurrent(Steps.Confirm),
    onCancel: () => handleClose(),
    closable: true,
    cancelButtonProps: { style: { display: 'none ' } },
    children: <p>We have encountered an unknown error, please try again.</p>
  };

  return <Modal visible={visible} {...steps[current]} />;
};
