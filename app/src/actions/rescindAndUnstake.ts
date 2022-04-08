import { StakeAccount, StakePool, UnbondingAccount } from "@jet-lab/jet-engine";
import { BN, Provider } from "@project-serum/anchor";
import {
  Governance,
  ProgramAccount,
  RpcContext,
  TokenOwnerRecord,
  withRelinquishVote
} from "@solana/spl-governance";
import { Transaction, TransactionInstruction } from "@solana/web3.js";
import { getParsedProposalsByGovernance, getUnrelinquishedVoteRecords } from "../hooks";
import { sendAllTransactionsWithNotifications } from "../tools/transactions";

export const rescindAndUnstake = async (
  { programId, wallet, walletPubkey, connection }: RpcContext,
  stakePool: StakePool,
  stakeAccount: StakeAccount,
  governance: ProgramAccount<Governance>,
  tokenOwnerRecord: ProgramAccount<TokenOwnerRecord>,
  amount: BN,
  explorerUrlMaker: Function
) => {
  const unbondingSeed = UnbondingAccount.randomSeed();
  const withdrawIxs: TransactionInstruction[] = [];
  const ix: TransactionInstruction[] = [];
  const allTxs = [];
  const provider = new Provider(connection, wallet as any, { skipPreflight: true });

  // Get unrescinded proposals and relinquish votes before unstaking
  const proposals = await getParsedProposalsByGovernance(connection, programId, governance);

  // FIXME: Handle error if there are unfinalised proposals
  if (tokenOwnerRecord.account.unrelinquishedVotesCount > 0) {
    console.log("Relinquish all votes and finalise all proposals to withdraw governing tokens");
    console.log(
      "unrelinquishedVotesCount",
      tokenOwnerRecord.account.unrelinquishedVotesCount,
      "outstandingProposalCount",
      tokenOwnerRecord.account.outstandingProposalCount
    );

    const voteRecords = await getUnrelinquishedVoteRecords(
      connection,
      programId,
      tokenOwnerRecord.account.governingTokenOwner
    );

    for (const voteRecord of Object.values(voteRecords)) {
      let proposal = proposals[voteRecord.account.proposal.toString()];

      if (!proposal) {
        continue;
      }

      console.log(
        "Relinquishing vote for proposal",
        proposal.pubkey.toString(),
        proposal.account.name,
        proposal
      );

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
  await UnbondingAccount.withUnbondStake(
    withdrawIxs,
    stakePool,
    stakeAccount,
    tokenOwnerRecord,
    walletPubkey,
    unbondingSeed,
    amount
  );

  const relinquishAndWithdrawTx = new Transaction().add(...withdrawIxs);
  allTxs.push({
    tx: relinquishAndWithdrawTx,
    signers: []
  });

  allTxs.push({
    tx: new Transaction().add(...ix),
    signers: []
  });

  await sendAllTransactionsWithNotifications(provider, allTxs, "JET has begun unbonding", explorerUrlMaker);
};
