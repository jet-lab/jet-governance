import {
  ChatMessageBody,
  GOVERNANCE_CHAT_PROGRAM_ID,
  ProgramAccount,
  Proposal,
  Realm,
  RpcContext,
  withPostChatMessage
} from "@solana/spl-governance";
import { PublicKey, Keypair, TransactionInstruction } from "@solana/web3.js";
import { sendTransactionWithNotifications } from "../../tools/transactions";

export async function postChatMessage(
  { connection, wallet, programId, walletPubkey }: RpcContext,
  realm: ProgramAccount<Realm>,
  proposal: ProgramAccount<Proposal>,
  tokeOwnerRecord: PublicKey,
  body: ChatMessageBody,
  explorerUrlMaker: Function,
  replyTo?: PublicKey
) {
  const signers: Keypair[] = [];
  const instructions: TransactionInstruction[] = [];

  const governanceAuthority = walletPubkey;
  const payer = walletPubkey;

  await withPostChatMessage(
    instructions,
    signers,
    GOVERNANCE_CHAT_PROGRAM_ID,
    programId,
    realm.pubkey,
    proposal.account.governance,
    proposal.pubkey,
    tokeOwnerRecord,
    governanceAuthority,
    payer,
    replyTo,
    body
  );

  await sendTransactionWithNotifications(
    connection,
    wallet,
    instructions,
    signers,
    "Chat message posted",
    explorerUrlMaker
  );
}
