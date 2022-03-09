import { Provider } from "@project-serum/anchor";
import { StakeAccount, StakePool, UnbondingAccount } from "@jet-lab/jet-engine";
import { RpcContext } from "@solana/spl-governance";
import { TransactionInstruction } from "@solana/web3.js";
import { sendTransactionWithNotifications } from "../tools/transactions";

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
    new Provider(connection, wallet as any, Provider.defaultOptions())
  );

  await sendTransactionWithNotifications(
    connection,
    wallet,
    instructions,
    [],
    "Withdrawing governing tokens",
    "Tokens have been withdrawn"
  );
};

export const withdrawAllUnbonded = async (
  { connection, wallet, walletPubkey }: RpcContext,
  unbondingAccounts: UnbondingAccount[],
  stakeAccount: StakeAccount,
  stakePool: StakePool
) => {
  let ix: TransactionInstruction[] = [];

  for (let i = 0; i < unbondingAccounts.length; i++) {
    await UnbondingAccount.withdrawUnbonded(
      unbondingAccounts[i],
      stakeAccount,
      stakePool,
      new Provider(connection, wallet as any, Provider.defaultOptions())
    );
  }

  await sendTransactionWithNotifications(
    connection,
    wallet,
    ix,
    [],
    "Withdrawing governing tokens",
    "Tokens have been withdrawn"
  );
};
