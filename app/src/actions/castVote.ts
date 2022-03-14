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
import { AssociatedToken, StakeAccount, StakeBalance, StakePool } from "@jet-lab/jet-engine";

export const castVote = async (
  { connection, wallet, programId, programVersion, walletPubkey }: RpcContext,
  realm: ProgramAccount<Realm>,
  proposal: ProgramAccount<Proposal>,
  tokenOwnerRecord: PublicKey,
  yesNoVote: YesNoVote,
  stakeProgram: Program,
  stakePool?: StakePool,
  stakeAccount?: StakeAccount,
  message?: ChatMessageBody,
  voteRecord?: PublicKey,
  stakeBalance?: StakeBalance
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

  // Check for difference between vote tokens
  //in governance program and staked JET
  // Mint vote tokens to top-up any difference
  if (stakeAccount && stakePool && stakeBalance?.stakedJet && wallet.publicKey) {
    const provider = stakeProgram.provider;
    const voteMint = stakePool.addresses.stakeVoteMint;
    const mintRemainingVotes = stakeBalance?.stakedJet.sub(stakeAccount.stakeAccount.mintedVotes);

    if (mintRemainingVotes.gt(stakePool.jetVotesPerShare)) {
      const voterTokenAccount = await AssociatedToken.withCreate(
        castVoteIx,
        provider,
        wallet.publicKey,
        voteMint
      );
      await StakeAccount.withCreate(
        castVoteIx,
        stakeProgram,
        stakePool.addresses.stakePool,
        wallet.publicKey,
        wallet.publicKey
      );
      await StakeAccount.withMintVotes(
        castVoteIx,
        stakePool,
        realm,
        wallet.publicKey,
        voterTokenAccount
      );

      await AssociatedToken.withClose(castVoteIx, wallet.publicKey, voteMint, wallet.publicKey);
    }
  }

  await withCastVote(
    castVoteIx,
    programId,
    programVersion,
    realm.pubkey,
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
      realm.pubkey,
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
    signers
  });

  await sendAllTransactionsWithNotifications(provider, allTxs, "Voting on proposal", "Vote cast");
};
