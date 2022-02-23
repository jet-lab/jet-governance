import { Airdrop, StakeAccount, StakePool } from '@jet-lab/jet-engine';
import { Program } from '@project-serum/anchor';
import { RpcContext } from '@solana/spl-governance';
import { sendTransactionWithNotifications } from '../tools/transactions';

export const claimAndStake = async (
  rpcContext: RpcContext,
  rewardsProgram: Program,
  airdrop: Airdrop,
  stakePool: StakePool,
  stakeAccount: StakeAccount
) => {
  const ix = await Airdrop.claim(
    rewardsProgram,
    airdrop,
    stakePool,
    stakeAccount
  );

  await sendTransactionWithNotifications(
    rpcContext.connection,
    rpcContext.wallet,
    ix,
    [],
    'Claiming and staking tokens',
    'Tokens claimed and staked'
  );
};
