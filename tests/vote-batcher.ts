import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import {
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  StakeProgram,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  SYSVAR_CLOCK_PUBKEY,
  Transaction,
  TransactionInstruction
} from "@solana/web3.js";
import { Token, TOKEN_PROGRAM_ID, u64 } from "@solana/spl-token";
import {
  withCreateRealm,
  withCreateTokenOwnerRecord,
  withCreateProposal,
  withCastVote,
  withCreateGovernance,
  withDepositGoverningTokens,
  MintMaxVoteWeightSource,
  getTokenHoldingAddress,
  getTokenOwnerRecordAddress,
  VoteTipping,
  VoteThresholdPercentage,
  VoteType,
  GovernanceConfig,
  Vote,
  YesNoVote,
  withSignOffProposal,
  withRelinquishVote,
  Proposal
} from "@solana/spl-governance";
import { assert } from "chai";
import { JetRewards } from "../target/types/jet_rewards";
import { JetStaking } from "../target/types/jet_staking";
import { JetAuth } from "../target/types/jet_auth";
import { JetVoteBatcher } from "../target/types/jet_vote_batcher";

const GOVERNANCE_ID = new PublicKey("JPGov2SBA6f7XSJF5R4Si5jEJekGiyrwP2m7gSEqLUs");
const RewardsProgram = anchor.workspace.JetRewards as Program<JetRewards>;
const StakingProgram = anchor.workspace.JetStaking as Program<JetStaking>;
const AuthProgram = anchor.workspace.JetAuth as Program<JetAuth>;
const VoteBatcherProgram = anchor.workspace.JetVoteBatcher as Program<JetVoteBatcher>;

const getErrorCode = (e: any): number => (e as anchor.AnchorError).error.errorCode.number;

interface StakePoolAccounts {
  stakePool: PublicKey;
  stakePoolVault: PublicKey;
  maxVoterWeightRecord: PublicKey;
  stakeCollateralMint: PublicKey;
}

interface ProposalMetadata {
  ownerRecord: PublicKey;
  key: PublicKey;
}

async function deriveStakePoolAccounts(seed: string, realm: PublicKey): Promise<StakePoolAccounts> {
  let [stakePool] = await PublicKey.findProgramAddress(
    [Buffer.from(seed)],
    StakingProgram.programId
  );
  let [stakePoolVault] = await PublicKey.findProgramAddress(
    [Buffer.from(seed), Buffer.from("vault")],
    StakingProgram.programId
  );
  let [maxVoterWeightRecord] = await PublicKey.findProgramAddress(
    [realm.toBuffer(), Buffer.from("max-vote-weight-record")],
    StakingProgram.programId
  );
  let [stakeCollateralMint] = await PublicKey.findProgramAddress(
    [Buffer.from(seed), Buffer.from("collateral-mint")],
    StakingProgram.programId
  );

  return {
    stakePool,
    maxVoterWeightRecord,
    stakeCollateralMint,
    stakePoolVault
  };
}

describe("vote-batcher", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  const wallet = provider.wallet as NodeWallet;
  anchor.setProvider(provider);

  const stakeSeed = "vote-batcher";
  const staker = Keypair.generate();
  const airdropKey = Keypair.generate();
  const airdropRecipients = Array.from({ length: 60 })
    .map(_ => Keypair.generate())
    .sort((a, b) => a.publicKey.toBuffer().compare(b.publicKey.toBuffer()));

  let testToken: Token;
  let councilToken: Token;
  let stakeAcc: StakePoolAccounts;

  let stakerAccount: PublicKey;
  let stakerVoterWeight: PublicKey;
  let stakerAuth: PublicKey;
  let stakerUnbond: PublicKey;
  let airdropVault: PublicKey;

  let distAccount: PublicKey;
  let distVault: PublicKey;
  let awardAccount: PublicKey;
  let awardVault: PublicKey;
  let govRealm: PublicKey;
  let govInstance: PublicKey;
  let govProposals: PublicKey[] = [];
  let proposals: ProposalMetadata[] = [];
  let govVault: PublicKey;
  let adminGovRecord: PublicKey;
  let stakerGovRecord: PublicKey;

  before(async () => {
    testToken = await Token.createMint(
      provider.connection,
      wallet.payer,
      wallet.publicKey,
      wallet.publicKey,
      6,
      TOKEN_PROGRAM_ID
    );
    councilToken = await Token.createMint(
      provider.connection,
      wallet.payer,
      wallet.publicKey,
      wallet.publicKey,
      0,
      TOKEN_PROGRAM_ID
    );

    [govRealm] = await PublicKey.findProgramAddress(
      [Buffer.from("governance"), Buffer.from("vote-batcher")],
      GOVERNANCE_ID
    );
    stakeAcc = await deriveStakePoolAccounts(stakeSeed, govRealm);
  });

  it("create pool", async () => {
    const config = { unbondPeriod: new u64(0), governanceRealm: govRealm };

    await StakingProgram.rpc.initPool(stakeSeed, config, {
      accounts: {
        payer: wallet.publicKey,
        authority: wallet.publicKey,
        tokenMint: testToken.publicKey,
        stakePool: stakeAcc.stakePool,
        maxVoterWeightRecord: stakeAcc.maxVoterWeightRecord,
        stakeCollateralMint: stakeAcc.stakeCollateralMint,
        stakePoolVault: stakeAcc.stakePoolVault,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY
      }
    });
  });

  const NUMBER_OF_PROPOSALS = 8;

  it("create realm old", async () => {
    let adminTokenAccount = await councilToken.getOrCreateAssociatedAccountInfo(wallet.publicKey);
    await councilToken.mintTo(
      adminTokenAccount.address,
      wallet.publicKey,
      [wallet.payer],
      1_000_000
    );

    let instructions: TransactionInstruction[] = [];

    govRealm = await withCreateRealm(
      instructions,
      GOVERNANCE_ID,
      2,
      "vote-batcher",
      wallet.payer.publicKey,
      testToken.publicKey,
      wallet.payer.publicKey,
      councilToken.publicKey,
      new MintMaxVoteWeightSource({ value: MintMaxVoteWeightSource.SUPPLY_FRACTION_BASE }),
      new anchor.BN(1),
      StakingProgram.programId,
      StakingProgram.programId
    );

    adminGovRecord = await withDepositGoverningTokens(
      instructions,
      GOVERNANCE_ID,
      2,
      govRealm,
      adminTokenAccount.address,
      councilToken.publicKey,
      wallet.publicKey,
      wallet.publicKey,
      wallet.payer.publicKey,
      new anchor.BN(1_000_000)
    );

    govInstance = await withCreateGovernance(
      instructions,
      GOVERNANCE_ID,
      2,
      govRealm,
      testToken.publicKey,
      new GovernanceConfig({
        voteTipping: VoteTipping.Strict,
        maxVotingTime: 1_000_000_000,
        minCommunityTokensToCreateProposal: new anchor.BN(1),
        minCouncilTokensToCreateProposal: new anchor.BN(1),
        minInstructionHoldUpTime: 1,
        voteThresholdPercentage: new VoteThresholdPercentage({ value: 100 })
      }),
      adminGovRecord,
      wallet.payer.publicKey,
      wallet.publicKey,
      undefined
    );
    await sendAndConfirmTransaction(provider.connection, new Transaction().add(...instructions), [
      wallet.payer
    ]);

    for (let i = 0; i != NUMBER_OF_PROPOSALS; i++) {
      let instructions: TransactionInstruction[] = [];
      let proposal = await withCreateProposal(
        instructions,
        GOVERNANCE_ID,
        2,
        govRealm,
        govInstance,
        adminGovRecord,
        "proposal" + i.toString(),
        "beep boop",
        testToken.publicKey,
        wallet.publicKey,
        i,
        VoteType.SINGLE_CHOICE,
        ["yes"],
        false,
        wallet.payer.publicKey,
        undefined
      );
      govProposals.push(proposal);
      await withSignOffProposal(
        instructions,
        GOVERNANCE_ID,
        2,
        govRealm,
        govInstance,
        proposal,
        wallet.publicKey,
        adminGovRecord,
        adminGovRecord
      );
      govVault = await getTokenHoldingAddress(
        GOVERNANCE_ID,
        govRealm,
        stakeAcc.maxVoterWeightRecord
      );
      stakerGovRecord = await getTokenOwnerRecordAddress(
        GOVERNANCE_ID,
        govRealm,
        stakeAcc.maxVoterWeightRecord,
        staker.publicKey
      );

      await sendAndConfirmTransaction(provider.connection, new Transaction().add(...instructions), [
        wallet.payer
      ]);
    }
  });

  // it("create realm and governance", async () => {
  //   let adminTokenAccount = await councilToken.getOrCreateAssociatedAccountInfo(wallet.publicKey);
  //   await councilToken.mintTo(
  //     adminTokenAccount.address,
  //     wallet.publicKey,
  //     [wallet.payer],
  //     1_000_000
  //   );

  //   let instructions: TransactionInstruction[] = [];

  //   govRealm = await withCreateRealm(
  //     instructions,
  //     GOVERNANCE_ID,
  //     2,
  //     "vote-batcher",
  //     wallet.payer.publicKey,
  //     testToken.publicKey,
  //     wallet.payer.publicKey,
  //     councilToken.publicKey,
  //     new MintMaxVoteWeightSource({ value: MintMaxVoteWeightSource.SUPPLY_FRACTION_BASE }),
  //     new anchor.BN(1),
  //     StakingProgram.programId,
  //     StakingProgram.programId
  //   );

  //   adminGovRecord = await withDepositGoverningTokens(
  //     instructions,
  //     GOVERNANCE_ID,
  //     2,
  //     govRealm,
  //     adminTokenAccount.address,
  //     councilToken.publicKey,
  //     wallet.publicKey,
  //     wallet.publicKey,
  //     wallet.payer.publicKey,
  //     new anchor.BN(1_000_000)
  //   );

  //   govInstance = await withCreateGovernance(
  //     instructions,
  //     GOVERNANCE_ID,
  //     2,
  //     govRealm,
  //     testToken.publicKey,
  //     new GovernanceConfig({
  //       voteTipping: VoteTipping.Strict,
  //       maxVotingTime: 1_000_000_000,
  //       minCommunityTokensToCreateProposal: new anchor.BN(1),
  //       minCouncilTokensToCreateProposal: new anchor.BN(1),
  //       minInstructionHoldUpTime: 1,
  //       voteThresholdPercentage: new VoteThresholdPercentage({ value: 100 })
  //     }),
  //     adminGovRecord,
  //     wallet.payer.publicKey,
  //     wallet.publicKey,
  //     undefined
  //   );

  //   await sendAndConfirmTransaction(provider.connection, new Transaction().add(...instructions), [
  //     wallet.payer
  //   ]);
  // });

  // it("create proposals", async () => {
  //   for (let i = 0; i != NUMBER_OF_PROPOSALS; i++) {
  //     let owner = Keypair.generate();
  //     let instructions: TransactionInstruction[] = [];

  //     let ownerTokenAccount = await councilToken.getOrCreateAssociatedAccountInfo(owner.publicKey);

  //     await councilToken.mintTo(
  //       ownerTokenAccount.address,
  //       wallet.publicKey,
  //       [wallet.payer],
  //       1_000_000
  //     );

  //     let ownerGovRecord = await withDepositGoverningTokens(
  //       instructions,
  //       GOVERNANCE_ID,
  //       2,
  //       govRealm,
  //       ownerTokenAccount.address,
  //       councilToken.publicKey,
  //       owner.publicKey,
  //       owner.publicKey,
  //       owner.publicKey,
  //       new anchor.BN(1_000_000)
  //     );

  //     // let proposal = await withCreateProposal(
  //     //   instructions,
  //     //   GOVERNANCE_ID,
  //     //   2,
  //     //   govRealm,
  //     //   govInstance,
  //     //   ownerGovRecord,
  //     //   "proposal" + i.toString(),
  //     //   "beep boop",
  //     //   testToken.publicKey,
  //     //   owner.publicKey,
  //     //   i,
  //     //   VoteType.SINGLE_CHOICE,
  //     //   ["yes"],
  //     //   false,
  //     //   wallet.payer.publicKey,
  //     //   undefined
  //     // );
  //     // govProposals.push(proposal);
  //     // proposals.push({
  //     //   ownerRecord: ownerGovRecord,
  //     //   key: proposal,
  //     // })

  //     // await withSignOffProposal(
  //     //   instructions,
  //     //   GOVERNANCE_ID,
  //     //   2,
  //     //   govRealm,
  //     //   govInstance,
  //     //   proposal,
  //     //   owner.publicKey,
  //     //   ownerGovRecord,
  //     //   ownerGovRecord
  //     // );

  //     govVault = await getTokenHoldingAddress(GOVERNANCE_ID, govRealm, stakeAcc.maxVoterWeightRecord);
  //     stakerGovRecord = await getTokenOwnerRecordAddress(
  //       GOVERNANCE_ID,
  //       govRealm,
  //       stakeAcc.maxVoterWeightRecord,
  //       staker.publicKey
  //     );

  //     await sendAndConfirmTransaction(provider.connection, new Transaction().add(...instructions), [
  //       owner,
  //       // wallet.payer,
  //     ]);
  //   }
  // });

  it("create staker auth", async () => {
    let bumpSeed: number;

    [stakerAuth, bumpSeed] = await PublicKey.findProgramAddress(
      [staker.publicKey.toBuffer()],
      AuthProgram.programId
    );

    await AuthProgram.rpc.createUserAuth({
      accounts: {
        user: staker.publicKey,
        payer: wallet.publicKey,
        auth: stakerAuth,
        systemProgram: SystemProgram.programId
      },
      signers: [staker]
    });
  });

  it("authenticate staker", async () => {
    await AuthProgram.rpc.authenticate({
      accounts: {
        // FIXME: ?? authority signer should be .. something
        authority: wallet.publicKey,
        auth: stakerAuth
      }
    });
  });

  it("create staker account", async () => {
    let bumpSeed: number;

    [stakerAccount, bumpSeed] = await PublicKey.findProgramAddress(
      [stakeAcc.stakePool.toBuffer(), staker.publicKey.toBuffer()],
      StakingProgram.programId
    );
    [stakerVoterWeight] = await PublicKey.findProgramAddress(
      [Buffer.from("voter-weight-record"), stakerAccount.toBuffer()],
      StakingProgram.programId
    );

    await StakingProgram.rpc.initStakeAccount({
      accounts: {
        owner: staker.publicKey,
        auth: stakerAuth,
        stakePool: stakeAcc.stakePool,
        stakeAccount: stakerAccount,
        voterWeightRecord: stakerVoterWeight,
        payer: wallet.publicKey,
        systemProgram: SystemProgram.programId
      },
      signers: [staker]
    });
  });

  it("create staker governance account", async () => {
    let instructions: TransactionInstruction[] = [];

    stakerGovRecord = await withCreateTokenOwnerRecord(
      instructions,
      GOVERNANCE_ID,
      govRealm,
      staker.publicKey,
      testToken.publicKey,
      wallet.payer.publicKey
    );
    await sendAndConfirmTransaction(provider.connection, new Transaction().add(...instructions), [
      wallet.payer
    ]);
  });

  it("vote and relinquish many - unbond only when no active votes", async () => {
    var remainingAccounts = [];
    var votes = [];
    for (var proposal of govProposals) {
      let voteRecord = (
        await PublicKey.findProgramAddress(
          [Buffer.from("governance"), proposal.toBuffer(), stakerGovRecord.toBuffer()],
          GOVERNANCE_ID
        )
      )[0];
      remainingAccounts.push({ pubkey: proposal, isSigner: false, isWritable: true });
      remainingAccounts.push({ pubkey: adminGovRecord, isSigner: false, isWritable: true });
      remainingAccounts.push({ pubkey: voteRecord, isSigner: false, isWritable: true });
      votes.push({ yes: {} });
    }
    let realmConfig = (
      await PublicKey.findProgramAddress(
        [Buffer.from("realm-config"), govRealm.toBuffer()],
        GOVERNANCE_ID
      )
    )[0];

    await VoteBatcherProgram.rpc.voteMany(votes, {
      accounts: {
        owner: staker.publicKey,
        realm: govRealm,
        governance: govInstance,
        voterTokenOwnerRecord: stakerGovRecord,
        governanceAuthority: staker.publicKey,
        governingTokenMint: testToken.publicKey,
        realmConfig: realmConfig,
        voterWeightRecord: stakerVoterWeight,
        maxVoterWeightRecord: stakeAcc.maxVoterWeightRecord,
        payer: wallet.payer.publicKey,
        governanceProgram: GOVERNANCE_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
        clock: SYSVAR_CLOCK_PUBKEY
      },
      remainingAccounts: remainingAccounts,
      signers: [staker, wallet.payer]
    });

    try {
      let unbondSeed = Buffer.alloc(4);

      [stakerUnbond] = await PublicKey.findProgramAddress(
        [stakerAccount.toBuffer(), unbondSeed],
        StakingProgram.programId
      );

      await StakingProgram.rpc.unbondStake(0, new u64(0), {
        accounts: {
          owner: staker.publicKey,
          payer: wallet.publicKey,
          stakeAccount: stakerAccount,
          voterWeightRecord: stakerVoterWeight,
          maxVoterWeightRecord: stakeAcc.maxVoterWeightRecord,
          tokenOwnerRecord: stakerGovRecord,
          stakePool: stakeAcc.stakePool,
          stakePoolVault: stakeAcc.stakePoolVault,
          unbondingAccount: stakerUnbond,
          systemProgram: SystemProgram.programId
        },
        signers: [staker]
      });

      assert.ok(false);
    } catch (e) {
      assert.equal(getErrorCode(e), 7102);
    }

    var remainingAccounts = [];
    for (var proposal of govProposals) {
      let voteRecord = (
        await PublicKey.findProgramAddress(
          [Buffer.from("governance"), proposal.toBuffer(), stakerGovRecord.toBuffer()],
          GOVERNANCE_ID
        )
      )[0];
      remainingAccounts.push({ pubkey: proposal, isSigner: false, isWritable: true });
      remainingAccounts.push({ pubkey: voteRecord, isSigner: false, isWritable: true });
    }
    await VoteBatcherProgram.rpc.relinquishMany({
      accounts: {
        owner: staker.publicKey,
        realm: govRealm,
        governance: govInstance,
        voterTokenOwnerRecord: stakerGovRecord,
        governanceAuthority: staker.publicKey,
        governingTokenMint: testToken.publicKey,
        realmConfig: realmConfig,
        voterWeightRecord: stakerVoterWeight,
        maxVoterWeightRecord: stakeAcc.maxVoterWeightRecord,
        beneficiary: wallet.payer.publicKey,
        governanceProgram: GOVERNANCE_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
        clock: SYSVAR_CLOCK_PUBKEY
      },
      remainingAccounts: remainingAccounts,
      signers: [staker]
    });

    let unbondSeed = Buffer.alloc(4);

    [stakerUnbond] = await PublicKey.findProgramAddress(
      [stakerAccount.toBuffer(), unbondSeed],
      StakingProgram.programId
    );

    await StakingProgram.rpc.unbondStake(0, new u64(0), {
      accounts: {
        owner: staker.publicKey,
        payer: wallet.publicKey,
        stakeAccount: stakerAccount,
        voterWeightRecord: stakerVoterWeight,
        maxVoterWeightRecord: stakeAcc.maxVoterWeightRecord,
        tokenOwnerRecord: stakerGovRecord,
        stakePool: stakeAcc.stakePool,
        stakePoolVault: stakeAcc.stakePoolVault,
        unbondingAccount: stakerUnbond,
        systemProgram: SystemProgram.programId
      },
      signers: [staker]
    });
  });
});
