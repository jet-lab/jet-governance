import { Provider } from "@project-serum/anchor";
import { AssociatedToken, StakeAccount, StakePool, UnbondingAccount } from "@jet-lab/jet-engine";
import { RpcContext } from "@solana/spl-governance";
import { TransactionInstruction } from "@solana/web3.js";
import { sendTransactionWithNotifications } from "../tools/transactions";

export const withdrawUnbonded = async (
  { connection, wallet, walletPubkey }: RpcContext,
  unbondingAccount: UnbondingAccount,
  stakeAccount: StakeAccount,
  stakePool: StakePool,
  explorerUrlMaker: Function
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
    "JET has been withdrawn",
    explorerUrlMaker
  );
};

export const withdrawAllUnbonded = async (
  { connection, wallet }: RpcContext,
  unbondingAccounts: UnbondingAccount[],
  stakeAccount: StakeAccount,
  stakePool: StakePool,
  explorerUrlMaker: Function
) => {
  let ix: TransactionInstruction[] = [];
  const provider = new Provider(connection, wallet as any, Provider.defaultOptions());

  const tokenReceiver = await AssociatedToken.withCreate(
    ix,
    provider,
    stakeAccount.stakeAccount.owner,
    stakePool.stakePool.tokenMint
  );

  for (let i = 0; i < unbondingAccounts.length; i++) {
    await UnbondingAccount.withWithdrawUnbonded(
      ix,
      unbondingAccounts[i],
      stakeAccount,
      stakePool,
      tokenReceiver,
      provider.wallet.publicKey
    );
  }

  await sendTransactionWithNotifications(
    connection,
    wallet,
    ix,
    [],
    "JET has been withdrawn",
    explorerUrlMaker
  );
};
