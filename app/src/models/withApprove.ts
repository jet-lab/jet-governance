import { Token, TOKEN_PROGRAM_ID, u64 } from "@solana/spl-token";
import { Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";
import BN from "bn.js";

export function withApprove(
  instructions: TransactionInstruction[],
  cleanupInstructions: TransactionInstruction[],
  account: PublicKey,
  owner: PublicKey,
  amount: number | BN | u64,
  autoRevoke = true,

  // if delegate is not passed ephemeral transfer authority is used
  delegate?: PublicKey,
  existingTransferAuthority?: Keypair,
): Keypair {
  const tokenProgram = TOKEN_PROGRAM_ID;

  const transferAuthority = existingTransferAuthority || new Keypair();
  const delegateKey = delegate ?? transferAuthority.publicKey;

  // Coerce amount to u64 in case it's deserialized as BN which differs by buffer conversion functions only
  // Without the coercion createApproveInstruction would fail because it won't be able to serialize it
  if (typeof amount !== 'number') {
    amount = new u64(amount.toArray());
  }

  instructions.push(
    Token.createApproveInstruction(
      tokenProgram,
      account,
      delegateKey,
      owner,
      [],
      amount,
    ),
  );

  if (autoRevoke) {
    cleanupInstructions.push(
      Token.createRevokeInstruction(tokenProgram, account, owner, []),
    );
  }

  return transferAuthority;
}
