import { AssociatedToken, JetMint, StakeAccount, StakePool } from "@jet-lab/jet-engine";
import { BN } from "@project-serum/anchor";
import { RpcContext } from "@solana/spl-governance";
import { Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { sendTransactionWithNotifications } from "../tools/transactions";
import { fromLamports } from "../utils";

export const addStake = async (
  { connection, wallet }: RpcContext,
  stakePool: StakePool,
  owner: PublicKey,
  amount: BN,
  jetMint: JetMint | undefined
) => {
  let instructions: TransactionInstruction[] = [];
  let signers: Keypair[] = [];

  const tokenMint = stakePool.stakePool.tokenMint;
  const tokenAccount = AssociatedToken.derive(tokenMint, owner);

  await StakeAccount.withCreate(
    instructions,
    stakePool.program,
    stakePool.addresses.stakePool,
    owner,
    owner
  );
  await StakeAccount.withAddStake(instructions, stakePool, owner, owner, tokenAccount, amount);

  const notificationTitle = `${fromLamports(amount, jetMint)} JET staked`;

  await sendTransactionWithNotifications(
    connection,
    wallet,
    instructions,
    signers,
    notificationTitle
  );
};
