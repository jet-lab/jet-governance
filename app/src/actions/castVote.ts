import { StakeAccount, StakeIdl, StakePool } from "@jet-lab/jet-engine";
import { Program, Provider } from "@project-serum/anchor";
import {
  ChatMessageBody,
  GOVERNANCE_CHAT_PROGRAM_ID,
  ProgramAccount,
  Proposal,
  Realm,
  RpcContext,
  Vote,
  VoteRecord,
  withCastVote,
  withPostChatMessage,
  withRelinquishVote,
  YesNoVote
} from "@solana/spl-governance";
import { PublicKey, Transaction, TransactionInstruction, Keypair } from "@solana/web3.js";
import { getVoteRecord } from "../hooks";
import { sendAllTransactionsWithNotifications } from "../tools/transactions";
import { GOVERNANCE_PROGRAM_ID } from "../utils";

export const castVote = async (
  { connection, wallet, programId, programVersion, walletPubkey }: RpcContext,
  realm: ProgramAccount<Realm>,
  proposal: ProgramAccount<Proposal>,
  tokenOwnerRecordPubkey: PublicKey,
  yesNoVote: YesNoVote,
  stakeProgram: Program<StakeIdl>,
  stakePool: StakePool,
  stakeAccount: StakeAccount,
  message?: ChatMessageBody
) => {
  let relinquishVoteIx: TransactionInstruction[] = [];
  let signers: Keypair[] = [];
  let castVoteIx: TransactionInstruction[] = [];
  const allTxs = [];

  let governanceAuthority = walletPubkey;
  let payer = walletPubkey;
  const provider = new Provider(connection, wallet as any, Provider.defaultOptions());

  // Withdraw existing vote before casting new vote
  // Then sign both transactions at once
  let voteRecord: ProgramAccount<VoteRecord> | undefined;
  try {
    voteRecord = await getVoteRecord(
      connection,
      GOVERNANCE_PROGRAM_ID,
      proposal.pubkey,
      tokenOwnerRecordPubkey
    );
  } catch {}
  if (voteRecord) {
    await withRelinquishVote(
      relinquishVoteIx,
      programId,
      proposal.account.governance,
      proposal.pubkey,
      tokenOwnerRecordPubkey,
      proposal.account.governingTokenMint,
      voteRecord.pubkey,
      governanceAuthority,
      payer
    );

    const relinquishTx = new Transaction().add(...relinquishVoteIx);
    allTxs.push({
      tx: relinquishTx,
      signers: []
    });
  }

  await StakeAccount.withCreate(
    castVoteIx,
    stakeProgram,
    stakePool.addresses.stakePool,
    walletPubkey,
    walletPubkey
  );

  await withCastVote(
    castVoteIx,
    programId,
    programVersion,
    realm.pubkey,
    proposal.account.governance,
    proposal.pubkey,
    proposal.account.tokenOwnerRecord,
    tokenOwnerRecordPubkey,
    governanceAuthority,
    proposal.account.governingTokenMint,
    Vote.fromYesNoVote(yesNoVote),
    payer,
    stakeAccount.addresses.voterWeightRecord,
    stakePool.stakePool.maxVoterWeightRecord
  );

  if (message) {
    await withPostChatMessage(
      castVoteIx,
      signers,
      GOVERNANCE_CHAT_PROGRAM_ID,
      programId,
      realm.pubkey,
      proposal.account.governance,
      proposal.pubkey,
      tokenOwnerRecordPubkey,
      governanceAuthority,
      payer,
      undefined,
      message
    );
  }

  const castTx = new Transaction().add(...castVoteIx);
  allTxs.push({
    tx: castTx,
    signers
  });

  await sendAllTransactionsWithNotifications(provider, allTxs, "Vote cast");
};
