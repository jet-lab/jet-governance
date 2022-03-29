import { AssociatedToken, StakeAccount, StakePool, UnbondingAccount } from "@jet-lab/jet-engine";
import { BN, Program, Provider } from "@project-serum/anchor";
import {
  Governance,
  ProgramAccount,
  TokenOwnerRecord,
  withDepositGoverningTokens,
  withRelinquishVote,
  withWithdrawGoverningTokens
} from "@solana/spl-governance";
import { Keypair, Transaction, TransactionInstruction } from "@solana/web3.js";
import { RpcContext } from "@solana/spl-governance";
import { sendAllTransactionsWithNotifications } from "../tools/transactions";
import { GOVERNANCE_PROGRAM_ID } from "../utils";
import { withApprove } from "../models/withApprove";
import {
  getParsedProposalsByGovernance,
  getUnrelinquishedVoteRecords
} from "../hooks/accountHooks";

export const rescindAndUnstake = async (
  { programId, programVersion, wallet, walletPubkey, connection }: RpcContext,
  stakeProgram: Program,
  stakePool: StakePool,
  stakeAccount: StakeAccount,
  governance: ProgramAccount<Governance>,
  tokenOwnerRecord: ProgramAccount<TokenOwnerRecord>,
  amount: BN
) => {
  const voteMint = stakePool.addresses.stakeVoteMint;
  const unbondingSeed = UnbondingAccount.randomSeed();
  let signers: Keypair[] = [];
  const relinquishAndWithdrawIx: TransactionInstruction[] = [];
  const ix: TransactionInstruction[] = [];
  const allTxs = [];
  const provider = new Provider(connection, wallet as any, { skipPreflight: true });
  const remainingStake = tokenOwnerRecord.account.governingTokenDepositAmount.sub(amount);

  // Get unrescinded proposals and relinquish votes before unstaking
  const proposals = await getParsedProposalsByGovernance(connection, programId, governance);

  // FIXME: Handle error if there are unfinalised proposals
  if (tokenOwnerRecord.account.unrelinquishedVotesCount > 0) {
    console.log("All Proposals Must Be Finalised To Withdraw Governing Tokens");
    console.log(
      "unrelinquishedVotesCount",
      tokenOwnerRecord.account.unrelinquishedVotesCount,
      "outstandingProposalCount",
      tokenOwnerRecord.account.outstandingProposalCount
    );

    const voteRecords = await getUnrelinquishedVoteRecords(
      connection,
      programId,
      tokenOwnerRecord!.account!.governingTokenOwner
    );
    for (const voteRecord of Object.values(voteRecords)) {
      let proposal = proposals[voteRecord.account.proposal.toString()];
      console.log("Relinquishing proposal", proposal.pubkey.toString(), proposal);

      if (!proposal) {
        continue;
      }

      // Note: We might hit single transaction limits here (accounts and size)
      // if user has too many unrelinquished votes
      withRelinquishVote(
        relinquishAndWithdrawIx,
        programId,
        proposal.account.governance,
        proposal.pubkey,
        tokenOwnerRecord!.pubkey,
        proposal.account.governingTokenMint,
        voteRecord.pubkey,
        tokenOwnerRecord!.account.governingTokenOwner,
        walletPubkey
      );
    }
  }

  // Create vote token account
  const voterTokenAccount = await AssociatedToken.withCreate(
    relinquishAndWithdrawIx,
    provider,
    walletPubkey,
    voteMint
  );
  // Unstake Votes
  await withWithdrawGoverningTokens(
    relinquishAndWithdrawIx,
    GOVERNANCE_PROGRAM_ID,
    governance.account.realm,
    voterTokenAccount,
    voteMint,
    walletPubkey
  );
  // Burn votes
  await StakeAccount.withBurnVotes(
    relinquishAndWithdrawIx,
    stakePool,
    stakeAccount,
    walletPubkey,
    voterTokenAccount,
    amount
  );
  // Unstake Jet
  await UnbondingAccount.withUnbondStake(
    relinquishAndWithdrawIx,
    stakePool,
    stakeAccount,
    wallet.publicKey!,
    unbondingSeed,
  );

  const relinquishAndWithdrawTx = new Transaction().add(...relinquishAndWithdrawIx);
  allTxs.push({
    tx: relinquishAndWithdrawTx,
    signers: []
  });

  const transferAuthority = withApprove(ix, [], voterTokenAccount, walletPubkey, remainingStake);
  signers.push(transferAuthority);
  // Get the total remaining token balance within the associated account
  // after requested amount has been unbonded
  // Restake Remaining Votes
  if (remainingStake.gt(new BN(0))) {
    await withDepositGoverningTokens(
      ix,
      GOVERNANCE_PROGRAM_ID,
      programVersion,
      governance.account.realm,
      voterTokenAccount,
      voteMint,
      walletPubkey,
      transferAuthority.publicKey,
      walletPubkey,
      remainingStake
    );
  }

  // Close vote token account
  await AssociatedToken.withClose(ix, walletPubkey, voteMint, walletPubkey);

  const restakeTx = new Transaction().add(...ix);
  allTxs.push({
    tx: restakeTx,
    signers
  });

  await sendAllTransactionsWithNotifications(provider, allTxs, "JET has begun unbonding");
};
