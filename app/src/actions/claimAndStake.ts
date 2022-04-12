import { Airdrop, RewardsIdl, StakeAccount, StakePool } from "@jet-lab/jet-engine";
import { Program } from "@project-serum/anchor";
import { RpcContext } from "@solana/spl-governance";
import { Keypair, TransactionInstruction } from "@solana/web3.js";
import { sendTransaction } from "../tools/transactions";

export const claimAndStake = async (
  { connection, wallet }: RpcContext,
  rewardsProgram: Program<RewardsIdl>,
  airdrop: Airdrop,
  stakePool: StakePool,
  stakeAccount: StakeAccount
): Promise<string> => {
  let instructions: TransactionInstruction[] = [];
  let signers: Keypair[] = [];

  await Airdrop.withClaim(instructions, rewardsProgram, airdrop, stakePool, stakeAccount);

  return await sendTransaction(
    connection,
    wallet,
    instructions,
    signers
  );
};
