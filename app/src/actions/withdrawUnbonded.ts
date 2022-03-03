import { StakeAccount, StakePool, UnbondingAccount } from '@jet-lab/jet-engine';
import { RpcContext } from '@solana/spl-governance';
import { sendTransactionWithNotifications } from '../tools/transactions';

export const withdrawUnbonded = async (
  { connection, wallet, walletPubkey }: RpcContext,
  unbondingAccount: UnbondingAccount,
  stakeAccount: StakeAccount,
  stakePool: StakePool
) => {
  const instructions = await UnbondingAccount.withdrawUnbonded(
    unbondingAccount,
    stakeAccount,
    stakePool,
    walletPubkey
  );

  await sendTransactionWithNotifications(
    connection,
    wallet,
    instructions,
    [],
    'Withdrawing governing tokens',
    'Tokens have been withdrawn'
  );
};
