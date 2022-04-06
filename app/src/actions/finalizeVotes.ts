import {
  getGovernanceProgramVersion,
  ProgramAccount,
  Proposal,
  RpcContext,
  withFinalizeVote
} from "@solana/spl-governance";
import { Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { sendTransactionWithNotifications } from "../tools/transactions";

export const finalizeVote = async (
  { connection, wallet, programId }: RpcContext,
  realm: PublicKey,
  proposal: ProgramAccount<Proposal>
) => {
  const signers: Keypair[] = [];
  const instructions: TransactionInstruction[] = [];

  // Explicitly request the version before making RPC calls to work around race conditions in resolving
  // the version for RealmInfo
  const programVersion = await getGovernanceProgramVersion(connection, programId);

  await withFinalizeVote(
    instructions,
    programId,
    programVersion,
    realm,
    proposal.account.governance,
    proposal.pubkey,
    proposal.account.tokenOwnerRecord,
    proposal.account.governingTokenMint
  );

  await sendTransactionWithNotifications(
    connection,
    wallet,
    instructions,
    signers,
    "Votes finalized"
  );
};
