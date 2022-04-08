import { AssociatedToken, StakeAccount, StakePool, UnbondingAccount } from "@jet-lab/jet-engine";
import { Provider } from "@project-serum/anchor";
import { ProgramAccount, Realm, RpcContext } from "@solana/spl-governance";
import { TransactionInstruction } from "@solana/web3.js";
import { sendTransactionWithNotifications } from "../tools/transactions";

export const restake = async (
  { connection, wallet, walletPubkey }: RpcContext,
  unbondingAccount: UnbondingAccount,
  stakeAccount: StakeAccount,
  stakePool: StakePool,
  realm: ProgramAccount<Realm>
) => {
  const ix: TransactionInstruction[] = [];
  await UnbondingAccount.withCancelUnbond(
    ix,
    unbondingAccount,
    stakeAccount,
    stakePool,
    walletPubkey
  );

  await sendTransactionWithNotifications(connection, wallet, ix, [], "JET has been staked");
};
