import { createApproveInstruction, createRevokeInstruction } from "@solana/spl-token";
import { Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";
import BN from "bn.js";
import { bnToBigInt } from "@jet-lab/jet-engine";

export function withApprove(
  instructions: TransactionInstruction[],
  cleanupInstructions: TransactionInstruction[],
  account: PublicKey,
  owner: PublicKey,
  amount: number | BN,
  autoRevoke = true,

  // if delegate is not passed ephemeral transfer authority is used
  delegate?: PublicKey,
  existingTransferAuthority?: Keypair
): Keypair {
  const transferAuthority = existingTransferAuthority || new Keypair();
  const delegateKey = delegate ?? transferAuthority.publicKey;

  instructions.push(createApproveInstruction(account, delegateKey, owner, bnToBigInt(amount)));

  if (autoRevoke) {
    cleanupInstructions.push(createRevokeInstruction(account, owner, []));
  }

  return transferAuthority;
}
