import { AssociatedToken, StakeAccount, StakePool, UnbondingAccount } from "@jet-lab/jet-engine";
import { BN, Provider } from "@project-serum/anchor";
import {
  Governance,
  ProgramAccount,
  Realm,
  TokenOwnerRecord,
  withRelinquishVote,
  withWithdrawGoverningTokens
} from "@solana/spl-governance";
import { Transaction, TransactionInstruction } from "@solana/web3.js";
import { RpcContext } from "@solana/spl-governance";
import { sendAllTransactionsWithNotifications } from "../tools/transactions";
import { GOVERNANCE_PROGRAM_ID } from "../utils";
import {
  getParsedProposalsByGovernance,
  getUnrelinquishedVoteRecords
} from "../hooks/accountHooks";

export const rescindAndUnstake = async (
  { programId, wallet, walletPubkey, connection }: RpcContext,
  stakePool: StakePool,
  stakeAccount: StakeAccount,
  realm: ProgramAccount<Realm>,
  governance: ProgramAccount<Governance>,
  tokenOwnerRecord: ProgramAccount<TokenOwnerRecord>,
  amount: BN,
  explorerUrlMaker: Function
) => {
  const voteMint = stakePool.addresses.stakeVoteMint;
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

  // Create vote token account
  let voterTokenAccount = await AssociatedToken.withCreate(
    withdrawIxs,
    provider,
    walletPubkey,
    voteMint
  );
  // Unstake Votes
  await withWithdrawGoverningTokens(
    withdrawIxs,
    GOVERNANCE_PROGRAM_ID,
    governance.account.realm,
    voterTokenAccount,
    voteMint,
    walletPubkey
  );
  // Burn votes
  await StakeAccount.withBurnVotes(
    withdrawIxs,
    stakePool,
    stakeAccount,
    walletPubkey,
    voterTokenAccount
  );
  // Unstake Jet
  await UnbondingAccount.withUnbondStake(
    withdrawIxs,
    stakePool,
    stakeAccount,
    walletPubkey,
    unbondingSeed,
    amount
  );
  // Close vote token account
  await AssociatedToken.withClose(withdrawIxs, walletPubkey, voteMint, walletPubkey);

  const relinquishAndWithdrawTx = new Transaction().add(...withdrawIxs);
  allTxs.push({
    tx: relinquishAndWithdrawTx,
    signers: []
  });

  // Recreate the voter token account for the next transaction
  voterTokenAccount = await AssociatedToken.withCreate(ix, provider, walletPubkey, voteMint);
  // Mint all votes that are remaining after burning
  await StakeAccount.withMintVotes(ix, stakePool, realm, walletPubkey, voterTokenAccount);

  // Close vote token account
  await AssociatedToken.withClose(ix, walletPubkey, voteMint, walletPubkey);

  allTxs.push({
    tx: new Transaction().add(...ix),
    signers: []
  });

  await sendAllTransactionsWithNotifications(
    provider,
    allTxs,
    "JET has begun unbonding",
    explorerUrlMaker
  );
};
