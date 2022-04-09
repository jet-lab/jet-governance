import { AssociatedToken, JetMint, StakeAccount, StakeIdl, StakePool } from "@jet-lab/jet-engine";
import { BN, Program, Provider } from "@project-serum/anchor";
import { SendTxRequest } from "@project-serum/anchor/dist/cjs/provider";
import {
  getTokenOwnerRecordForRealm,
  Governance,
  ProgramAccount,
  RpcContext,
  TokenOwnerRecord,
  withCastVote,
  withCreateTokenOwnerRecord,
  withRelinquishVote
} from "@solana/spl-governance";
import { PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { getParsedProposalsByGovernance, getUnrelinquishedVoteRecords } from "../hooks";
import { sendAllTransactionsWithNotifications } from "../tools/transactions";
import { fromLamports, GOVERNANCE_PROGRAM_ID } from "../utils";

export const addStake = async (
  { connection, wallet, programId, walletPubkey, programVersion }: RpcContext,
  stakePool: StakePool,
  owner: PublicKey,
  amount: BN,
  jetMint: JetMint | undefined,
  governance: ProgramAccount<Governance>,
  stakeProgram: Program<StakeIdl>,
  stakeAccount: StakeAccount | undefined
) => {
  const allTxs: SendTxRequest[] = [];
  const provider = new Provider(connection, wallet as any, { skipPreflight: true });
  const tokenMint = stakePool.stakePool.tokenMint;
  const tokenAccount = AssociatedToken.derive(tokenMint, owner);
  const proposals = await getParsedProposalsByGovernance(connection, programId, governance);

  let instructions: TransactionInstruction[] = [];
  await StakeAccount.withCreate(
    instructions,
    stakePool.program,
    stakePool.addresses.stakePool,
    owner,
    owner
  );
  await StakeAccount.withAddStake(instructions, stakePool, owner, owner, tokenAccount, amount);

  allTxs.push({
    tx: new Transaction().add(...instructions),
    signers: []
  });

  let tokenOwnerRecord: ProgramAccount<TokenOwnerRecord> | undefined;
  try {
    tokenOwnerRecord = await getTokenOwnerRecordForRealm(
      connection,
      GOVERNANCE_PROGRAM_ID,
      stakePool.stakePool.governanceRealm,
      stakePool.stakePool.tokenMint,
      owner
    );
  } catch (err: any) {
    console.log(err);
  }
  if (!tokenOwnerRecord) {
    // if there is no prior token owner record
    // create one so that the owner can cast votes
    let createStakerGovRecord: TransactionInstruction[] = [];
    await withCreateTokenOwnerRecord(
      createStakerGovRecord,
      GOVERNANCE_PROGRAM_ID,
      stakePool.stakePool.governanceRealm,
      owner,
      stakePool.stakePool.tokenMint,
      owner
    );

    allTxs.push({
      tx: new Transaction().add(...createStakerGovRecord),
      signers: []
    });
  } else if (tokenOwnerRecord.account.unrelinquishedVotesCount > 0) {
    // Rescind, then re-cast votes on any currently voting proposals
    // In order to update vote weight

    const voteRecords = await getUnrelinquishedVoteRecords(
      connection,
      programId,
      tokenOwnerRecord.account.governingTokenOwner
    );
    for (const i in voteRecords) {
      let proposal = proposals[voteRecords[i].account.proposal.toString()];
      if (!proposal) {
        continue;
      }
      const relinquishIxs: TransactionInstruction[] = [];
      withRelinquishVote(
        relinquishIxs,
        programId,
        proposal.account.governance,
        proposal.pubkey,
        tokenOwnerRecord.pubkey,
        proposal.account.governingTokenMint,
        voteRecords[i].pubkey,
        tokenOwnerRecord.account.governingTokenOwner,
        walletPubkey
      );
      allTxs.push({
        tx: new Transaction().add(...relinquishIxs),
        signers: []
      });
    }

    for (const i in voteRecords) {
      let proposal = proposals[voteRecords[i].account.proposal.toString()];
      if (!proposal || proposal.account.hasVoteTimeEnded(governance.account)) {
        continue;
      }
      if (voteRecords[i].account.vote && stakeAccount) {
        const recastIxs: TransactionInstruction[] = [];
        await withCastVote(
          recastIxs,
          programId,
          programVersion,
          stakePool.stakePool.governanceRealm,
          proposal.account.governance,
          proposal.pubkey,
          proposal.account.tokenOwnerRecord,
          tokenOwnerRecord.pubkey,
          walletPubkey,
          proposal.account.governingTokenMint,
          voteRecords[i].account.vote!,
          walletPubkey,
          stakeAccount.addresses.voterWeightRecord,
          stakePool.stakePool.maxVoterWeightRecord
        );
        allTxs.push({
          tx: new Transaction().add(...recastIxs),
          signers: []
        });
      }
    }
  }

  const notificationTitle = `${fromLamports(amount, jetMint)} JET staked`;

  await sendAllTransactionsWithNotifications(provider, allTxs, notificationTitle);
};
