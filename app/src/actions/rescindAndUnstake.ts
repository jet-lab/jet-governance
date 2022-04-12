import { StakeAccount, StakePool, UnbondingAccount } from "@jet-lab/jet-engine";
import { BN, Provider } from "@project-serum/anchor";
import {
  getTokenOwnerRecordAddress,
  getTokenOwnerRecordForRealm,
  Governance,
  ProgramAccount,
  RpcContext,
  TokenOwnerRecord,
  withCreateTokenOwnerRecord,
  withRelinquishVote
} from "@solana/spl-governance";
import { Transaction, TransactionInstruction } from "@solana/web3.js";
import { getParsedProposalsByGovernance, getUnrelinquishedVoteRecords } from "../hooks";
import { sendAllTransactions } from "../tools/transactions";
import { GOVERNANCE_PROGRAM_ID } from "../utils";

export const rescindAndUnstake = async (
  { programId, wallet, walletPubkey, connection }: RpcContext,
  stakePool: StakePool,
  stakeAccount: StakeAccount,
  governance: ProgramAccount<Governance>,
  amount: BN
): Promise<string> => {
  const unbondingSeed = UnbondingAccount.randomSeed();
  const allTxs = [];
  const provider = new Provider(connection, wallet as any, { skipPreflight: true });

  // Load the token owner record
  const tokenOwnerRecordAddress = await getTokenOwnerRecordAddress(
    GOVERNANCE_PROGRAM_ID,
    stakePool.stakePool.governanceRealm,
    stakePool.stakePool.tokenMint,
    walletPubkey
  );
  let tokenOwnerRecord: ProgramAccount<TokenOwnerRecord> | undefined;
  try {
    tokenOwnerRecord = await getTokenOwnerRecordForRealm(
      connection,
      GOVERNANCE_PROGRAM_ID,
      stakePool.stakePool.governanceRealm,
      stakePool.stakePool.tokenMint,
      walletPubkey
    );
  } catch (err: any) {
    console.log(err);
  }
  if (!tokenOwnerRecord) {
    const ix: TransactionInstruction[] = [];

    // unbond_stake requires that the token owner record must exist,
    // so that it can verify that the owner is allowed to withdraw
    await withCreateTokenOwnerRecord(
      ix,
      GOVERNANCE_PROGRAM_ID,
      stakePool.stakePool.governanceRealm,
      walletPubkey,
      stakePool.stakePool.tokenMint,
      walletPubkey
    );

    allTxs.push({
      tx: new Transaction().add(...ix),
      signers: []
    });
  } else if (tokenOwnerRecord.account.unrelinquishedVotesCount > 0) {
    const voteRecords = await getUnrelinquishedVoteRecords(
      connection,
      programId,
      tokenOwnerRecord.account.governingTokenOwner
    );

    const proposals = await getParsedProposalsByGovernance(connection, programId, governance);

    for (const voteRecord of Object.values(voteRecords)) {
      let proposal = proposals[voteRecord.account.proposal.toString()];

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
        voteRecord.pubkey,
        tokenOwnerRecord.account.governingTokenOwner,
        walletPubkey
      );
      allTxs.push({
        tx: new Transaction().add(...relinquishIxs),
        signers: []
      });
    }
  }

  // Unstake Jet
  const unbondIxs: TransactionInstruction[] = [];
  await UnbondingAccount.withUnbondStake(
    unbondIxs,
    stakePool,
    stakeAccount,
    tokenOwnerRecordAddress,
    walletPubkey,
    unbondingSeed,
    amount
  );

  allTxs.push({
    tx: new Transaction().add(...unbondIxs),
    signers: []
  });

  return await sendAllTransactions(provider, allTxs);
};
