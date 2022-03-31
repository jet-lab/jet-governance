import { Provider } from "@project-serum/anchor";
import { AssociatedToken, StakeAccount, StakePool, UnbondingAccount } from "@jet-lab/jet-engine";
import { RpcContext } from "@solana/spl-governance";
import { Transaction, TransactionInstruction } from "@solana/web3.js";
import {
  sendAllTransactionsWithNotifications,
  sendTransactionWithNotifications
} from "../tools/transactions";
import { SendTxRequest } from "@project-serum/anchor/dist/cjs/provider";

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
    "JET has been withdrawn"
  );
};

export const withdrawAllUnbonded = async (
  { connection, wallet }: RpcContext,
  unbondingAccounts: UnbondingAccount[],
  stakeAccount: StakeAccount,
  stakePool: StakePool
) => {
  let ix: TransactionInstruction[] = [];
  const allTxs: SendTxRequest[] = [];
  const provider = new Provider(connection, wallet as any, Provider.defaultOptions());

  const tokenReceiver = await AssociatedToken.withCreate(
    ix,
    provider,
    stakeAccount.stakeAccount.owner,
    stakePool.stakePool.tokenMint
  );
  allTxs.push({
    tx: new Transaction().add(...ix),
    signers: []
  });

  for (let i = 0; i < unbondingAccounts.length; i++) {
    const unbondedState = UnbondingAccount.isUnbonded(unbondingAccounts[i]);
    if (unbondedState) {
      ix = [];
      await UnbondingAccount.withWithdrawUnbonded(
        ix,
        unbondingAccounts[i],
        stakeAccount,
        stakePool,
        tokenReceiver,
        provider.wallet.publicKey
      );
      const unboundTx = new Transaction().add(...ix);
      allTxs.push({
        tx: unboundTx,
        signers: []
      });
    }
  }
  await sendAllTransactionsWithNotifications(provider, allTxs, "JET has been withdrawn");
};
