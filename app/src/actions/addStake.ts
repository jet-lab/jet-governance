import { AssociatedToken, StakeAccount, StakePool } from "@jet-lab/jet-engine";
import { BN } from "@project-serum/anchor";
import {
  getTokenOwnerRecordForRealm,
  ProgramAccount,
  RpcContext,
  TokenOwnerRecord,
  withCreateTokenOwnerRecord
} from "@solana/spl-governance";
import { Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { sendTransaction } from "../tools/transactions";
import { GOVERNANCE_PROGRAM_ID } from "../utils";

export const addStake = async (
  { connection, wallet }: RpcContext,
  stakePool: StakePool,
  owner: PublicKey,
  amount: BN
): Promise<string> => {
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

  let tokenOwnerRecord: ProgramAccount<TokenOwnerRecord> | undefined;
  try {
    tokenOwnerRecord = await getTokenOwnerRecordForRealm(
      connection,
      GOVERNANCE_PROGRAM_ID,
      stakePool.stakePool.governanceRealm,
      stakePool.stakePool.tokenMint,
      owner
    );
  } catch (err: any) {
    console.log(err);
  }
  if (!tokenOwnerRecord) {
    // if there is no prior token owner record
    // create one so that the owner can cast votes
    await withCreateTokenOwnerRecord(
      instructions,
      GOVERNANCE_PROGRAM_ID,
      stakePool.stakePool.governanceRealm,
      owner,
      stakePool.stakePool.tokenMint,
      owner
    );
  }

  return await sendTransaction(connection, wallet, instructions, signers);
};
