import { Airdrop, RewardsIdl, StakeAccount, StakePool } from "@jet-lab/jet-engine";
import { Program } from "@project-serum/anchor";
import { RpcContext } from "@solana/spl-governance";
import { Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { sendTransaction } from "../tools/transactions";

export const claimAndStake = async (
  { connection, wallet }: RpcContext,
  rewardsProgram: Program<RewardsIdl>,
  airdrop: Airdrop,
  stakePool: StakePool,
  stakeAccount: StakeAccount,
  owner: PublicKey
): Promise<string> => {
  let instructions: TransactionInstruction[] = [];
  let signers: Keypair[] = [];

  if (!stakeAccount) {
    await StakeAccount.withCreate(
      instructions,
      stakePool.program,
      stakePool.addresses.stakePool,
      owner,
      owner
    );
  }
  await Airdrop.withClaim(instructions, rewardsProgram, airdrop, stakePool, stakeAccount);

  return await sendTransaction(connection, wallet, instructions, signers);
};
