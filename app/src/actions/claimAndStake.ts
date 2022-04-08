import { Airdrop, RewardsIdl, StakeAccount, StakePool } from "@jet-lab/jet-engine";
import { Program } from "@project-serum/anchor";
import { RpcContext } from "@solana/spl-governance";
import { Keypair, TransactionInstruction } from "@solana/web3.js";
import { sendTransactionWithNotifications } from "../tools/transactions";

export const claimAndStake = async (
  { connection, wallet }: RpcContext,
  rewardsProgram: Program<RewardsIdl>,
  airdrop: Airdrop,
  stakePool: StakePool,
  stakeAccount: StakeAccount,
  explorerUrlMaker: Function
) => {
  let instructions: TransactionInstruction[] = [];
  let signers: Keypair[] = [];

  await Airdrop.withClaim(instructions, rewardsProgram, airdrop, stakePool, stakeAccount);

  await sendTransactionWithNotifications(
    connection,
    wallet,
    instructions,
    signers,
    "JET claimed and staked",
    explorerUrlMaker
  );
};
