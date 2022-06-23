import { AnchorProvider } from "@project-serum/anchor";
import { AssociatedToken, StakeAccount, StakePool, UnbondingAccount } from "@jet-lab/jet-engine";
import { RpcContext } from "@solana/spl-governance";
import { Signer, Transaction, TransactionInstruction } from "@solana/web3.js";
import { sendAllTransactions } from "../tools/transactions";

export const withdrawUnbonded = async (
  { connection, wallet }: RpcContext,
  unbondingAccounts: UnbondingAccount[],
  stakeAccount: StakeAccount,
  stakePool: StakePool
): Promise<string | undefined> => {
  let ix: TransactionInstruction[] = [];
  const allTxs: {
    tx: Transaction;
    signers: Signer[];
  }[] = [];
  const provider = new AnchorProvider(connection, wallet as any, { skipPreflight: true });

  const tokenReceiver = await AssociatedToken.withCreate(
    ix,
    provider,
    stakeAccount.stakeAccount.owner,
    stakePool.stakePool.tokenMint
  );

  if (ix.length > 0) {
    allTxs.push({
      tx: new Transaction().add(...ix),
      signers: []
    });
  }

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
  if (allTxs.length > 0) {
    return await sendAllTransactions(provider, allTxs);
  }
};
