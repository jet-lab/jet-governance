import { PublicKey, Transaction, TransactionInstruction, Keypair } from "@solana/web3.js";
import { sendAllTransactionsWithNotifications } from "../tools/transactions";
import { Program, Provider } from "@project-serum/anchor";
import {
  ChatMessageBody,
  GOVERNANCE_CHAT_PROGRAM_ID,
  ProgramAccount,
  Proposal,
  Realm,
  RpcContext,
  Vote,
  withCastVote,
  withPostChatMessage,
  withRelinquishVote,
  YesNoVote
} from "@solana/spl-governance";
import { AssociatedToken, StakeAccount, StakePool } from "@jet-lab/jet-engine";

export const castVote = async (
  { connection, wallet, programId, programVersion, walletPubkey }: RpcContext,
  realm: ProgramAccount<Realm>,
  proposal: ProgramAccount<Proposal>,
  tokenOwnerRecordPubkey: PublicKey,
  yesNoVote: YesNoVote,
  stakeProgram: Program,
  stakePool: StakePool,
  explorerUrlMaker: Function,
  message?: ChatMessageBody,
  voteRecord?: PublicKey
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
  if (voteRecord) {
    await withRelinquishVote(
      relinquishVoteIx,
      programId,
      proposal.account.governance,
      proposal.pubkey,
      tokenOwnerRecordPubkey,
      proposal.account.governingTokenMint,
      voteRecord,
      governanceAuthority,
      payer
    );

    const relinquishTx = new Transaction().add(...relinquishVoteIx);
    allTxs.push({
      tx: relinquishTx,
      signers: []
    });
  }

  const voteMint = stakePool.addresses.stakeVoteMint;

  const voterTokenAccount = await AssociatedToken.withCreate(
    castVoteIx,
    provider,
    walletPubkey,
    voteMint
  );
  await StakeAccount.withCreate(
    castVoteIx,
    stakeProgram,
    stakePool.addresses.stakePool,
    walletPubkey,
    walletPubkey
  );
  await StakeAccount.withMintVotes(castVoteIx, stakePool, realm, walletPubkey, voterTokenAccount);

  await AssociatedToken.withClose(castVoteIx, walletPubkey, voteMint, walletPubkey);

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
    payer
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

  await sendAllTransactionsWithNotifications(provider, allTxs, "Vote cast", explorerUrlMaker);
};
