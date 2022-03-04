import { PublicKey, Transaction, TransactionInstruction, Keypair } from "@solana/web3.js";
import { sendAllTransactionsWithNotifications } from "../tools/transactions";
import { Provider } from "@project-serum/anchor";
import {
  ChatMessageBody,
  GOVERNANCE_CHAT_PROGRAM_ID,
  ProgramAccount,
  Proposal,
  RpcContext,
  Vote,
  withCastVote,
  withPostChatMessage,
  withRelinquishVote,
  YesNoVote
} from "@solana/spl-governance";
import { AssociatedToken, bnToNumber, StakeAccount, StakePool } from "@jet-lab/jet-engine";

export const castVote = async (
  { connection, wallet, programId, programVersion, walletPubkey }: RpcContext,
  realm: PublicKey,
  proposal: ProgramAccount<Proposal>,
  tokenOwnerRecord: PublicKey,
  yesNoVote: YesNoVote,
  stakePool?: StakePool,
  stakeAccount?: StakeAccount,
  message?: ChatMessageBody,
  voteRecord?: PublicKey
) => {
  let mintVoteIx: TransactionInstruction[] = [];
  let relinquishVoteIx: TransactionInstruction[] = [];
  let signers: Keypair[] = [];
  let castVoteIx: TransactionInstruction[] = [];
  const allTxs = [];

  let governanceAuthority = walletPubkey;
  let payer = walletPubkey;
  const provider = new Provider(connection, wallet as any, Provider.defaultOptions());

  // Check for difference between vote tokens
  //in governance program and staked JET
  // Mint vote tokens to top-up any difference
  if (stakeAccount && stakePool) {
    const voteMint = stakePool.addresses.stakeVoteMint;

    const jetPerStakedShare = stakePool?.vault.amount.div(stakePool?.stakePool.sharesBonded);
    const mintRemainingVotes = stakeAccount.stakeAccount.shares
      .mul(jetPerStakedShare)
      .sub(stakeAccount.stakeAccount.mintedVotes);

    const voterTokenAccount = await AssociatedToken.withCreate(
      mintVoteIx,
      provider,
      payer,
      voteMint
    );

    await StakeAccount.withMintVotes(
      mintVoteIx,
      stakePool,
      payer,
      voterTokenAccount,
      mintRemainingVotes
    );

    const mintVoteTx = new Transaction().add(...mintVoteIx);
    allTxs.push({
      tx: mintVoteTx,
      signers: []
    });
  }

  // Withdraw existing vote before casting new vote
  // Then sign both transactions at once
  if (tokenOwnerRecord && voteRecord) {
    await withRelinquishVote(
      relinquishVoteIx,
      programId,
      proposal.account.governance,
      proposal.pubkey,
      tokenOwnerRecord,
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

  await withCastVote(
    castVoteIx,
    programId,
    programVersion,
    realm,
    proposal.account.governance,
    proposal.pubkey,
    proposal.account.tokenOwnerRecord,
    tokenOwnerRecord,
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
      realm,
      proposal.account.governance,
      proposal.pubkey,
      tokenOwnerRecord,
      governanceAuthority,
      payer,
      undefined,
      message
    );
  }

  const castTx = new Transaction().add(...castVoteIx);
  allTxs.push({
    tx: castTx,
    signers: []
  });

  await sendAllTransactionsWithNotifications(provider, allTxs, "Voting on proposal", "Vote cast");
};
