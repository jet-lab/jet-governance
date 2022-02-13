import { PublicKey, Transaction, TransactionInstruction, Keypair } from '@solana/web3.js';
import { sendAllTransactionsWithNotifications } from '../tools/transactions';
import { Provider } from '@project-serum/anchor';
import { ChatMessageBody, GOVERNANCE_CHAT_PROGRAM_ID, ProgramAccount, Proposal, RpcContext, Vote, withCastVote, withPostChatMessage, withRelinquishVote, YesNoVote } from '@solana/spl-governance';

export const castVote = async (
  { connection, wallet, programId, programVersion, walletPubkey }: RpcContext,
  realm: PublicKey,
  proposal: ProgramAccount<Proposal>,
  tokenOwnerRecord: PublicKey,
  yesNoVote: YesNoVote,
  message?: ChatMessageBody,
  voteRecord?: PublicKey
) => {
  let relinquishVoteIx: TransactionInstruction[] = [];
  let signers: Keypair[] = [];
  let castVoteIx: TransactionInstruction[] = [];
  const allTxs = [];

  let governanceAuthority = walletPubkey;
  let payer = walletPubkey;

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
    )
  
    const relinquishTx = new Transaction().add(...relinquishVoteIx)
    allTxs.push({
      tx: relinquishTx,
      signers: []
    })
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
    payer,
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
    )
  }

  const castTx = new Transaction().add(...castVoteIx)
  allTxs.push({
    tx: castTx,
    signers: []
  })

  const provider = new Provider(connection, wallet as any, Provider.defaultOptions())
  await sendAllTransactionsWithNotifications(
    provider,
    allTxs,
    'Voting on proposal',
    'Vote cast',
  );
};
