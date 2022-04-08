import {
  getGovernanceProgramVersion,
  ProgramAccount,
  Proposal,
  RpcContext,
  withCancelProposal
} from "@solana/spl-governance";
import { Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { sendTransactionWithNotifications } from "../tools/transactions";

export const cancelProposal = async (
  { connection, wallet, programId, walletPubkey }: RpcContext,
  realmPk: PublicKey,
  proposal: ProgramAccount<Proposal> | undefined,
  explorerUrlMaker: Function
) => {
  const instructions: TransactionInstruction[] = [];
  const signers: Keypair[] = [];
  const governanceAuthority = walletPubkey;

  // Explicitly request the version before making RPC calls to work around race conditions in resolving
  // the version for RealmInfo
  const programVersion = await getGovernanceProgramVersion(connection, programId);

  withCancelProposal(
    instructions,
    programId,
    programVersion,
    realmPk,
    proposal!.account.governance,
    proposal!.pubkey,
    proposal!.account.tokenOwnerRecord,
    governanceAuthority
  );

  await sendTransactionWithNotifications(
    connection,
    wallet,
    instructions,
    signers,
    "Proposal cancelled",
    explorerUrlMaker
  );
};
