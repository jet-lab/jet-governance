import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import { Token, TOKEN_PROGRAM_ID, u64 } from "@solana/spl-token";
import { JetRewards } from "../target/types/jet_rewards";
import { JetStaking } from "../target/types/jet_staking";
import { assert } from "chai";

const RewardsProgram = anchor.workspace.JetRewards as Program<JetRewards>;
const StakingProgram = anchor.workspace.JetStaking as Program<JetStaking>;

const AIRDROP_FLAG_VERIFICATION_REQUIRED = 1 << 0;

interface StakePoolBumpSeeds {
  stakePool: number;
  stakePoolVault: number;
  stakeVoteMint: number;
  stakeCollateralMint: number;
}

interface StakePoolAccounts {
  stakePool: PublicKey;
  stakePoolVault: PublicKey;
  stakeVoteMint: PublicKey;
  stakeCollateralMint: PublicKey;

  bumpSeeds: StakePoolBumpSeeds;
}

async function deriveStakePoolAccounts(
  seed: string
): Promise<StakePoolAccounts> {
  let [stakePool, stakePoolBump] = await PublicKey.findProgramAddress(
    [Buffer.from(seed)],
    StakingProgram.programId
  );
  let [stakePoolVault, stakePoolVaultBump] = await PublicKey.findProgramAddress(
    [Buffer.from(seed), Buffer.from("vault")],
    StakingProgram.programId
  );
  let [stakeVoteMint, stakeVoteMintBump] = await PublicKey.findProgramAddress(
    [Buffer.from(seed), Buffer.from("vote-mint")],
    StakingProgram.programId
  );
  let [stakeCollateralMint, stakeCollateralMintBump] =
    await PublicKey.findProgramAddress(
      [Buffer.from(seed), Buffer.from("collateral-mint")],
      StakingProgram.programId
    );

  return {
    stakePool,
    stakeVoteMint,
    stakeCollateralMint,
    stakePoolVault,

    bumpSeeds: {
      stakePool: stakePoolBump,
      stakeVoteMint: stakeVoteMintBump,
      stakeCollateralMint: stakeCollateralMintBump,
      stakePoolVault: stakePoolVaultBump,
    },
  };
}

describe("airdrop-staking", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.Provider.env();
  const wallet = provider.wallet as NodeWallet;
  anchor.setProvider(provider);

  const stakeSeed = "test";
  const staker = Keypair.generate();
  const airdropKey = Keypair.generate();

  let testToken: Token;
  let stakeAcc: StakePoolAccounts;

  let stakerAccount: PublicKey;
  let stakerClaim: PublicKey;
  let stakerUnbond: PublicKey;
  let airdropVault: PublicKey;

  before(async () => {
    testToken = await Token.createMint(
      provider.connection,
      wallet.payer,
      wallet.publicKey,
      wallet.publicKey,
      6,
      TOKEN_PROGRAM_ID
    );

    stakeAcc = await deriveStakePoolAccounts(stakeSeed);
  });

  it("create pool", async () => {
    const config = { unbondPeriod: new u64(0) };

    await StakingProgram.rpc.initPool(stakeSeed, stakeAcc.bumpSeeds, config, {
      accounts: {
        payer: wallet.publicKey,
        authority: wallet.publicKey,
        tokenMint: testToken.publicKey,
        stakePool: stakeAcc.stakePool,
        stakeVoteMint: stakeAcc.stakeVoteMint,
        stakeCollateralMint: stakeAcc.stakeCollateralMint,
        stakePoolVault: stakeAcc.stakePoolVault,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      },
    });
  });

  it("create staker account", async () => {
    let bumpSeed: number;

    [stakerAccount, bumpSeed] = await PublicKey.findProgramAddress(
      [stakeAcc.stakePool.toBuffer(), staker.publicKey.toBuffer()],
      StakingProgram.programId
    );

    await StakingProgram.rpc.initStakeAccount(bumpSeed, {
      accounts: {
        owner: staker.publicKey,
        stakePool: stakeAcc.stakePool,
        stakeAccount: stakerAccount,
        payer: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [staker],
    });
  });

  it("create airdrop", async () => {
    let bumpSeed: number;

    [airdropVault, bumpSeed] = await PublicKey.findProgramAddress(
      [airdropKey.publicKey.toBuffer(), Buffer.from("vault")],
      RewardsProgram.programId
    );

    const params = {
      vestStartAt: new anchor.BN(0),
      vestEndAt: new anchor.BN(0),
      expireAt: new anchor.BN(Date.now() + 10),
      stakePool: stakeAcc.stakePool,
      shortDesc: "integ-test-airdrop",
      vaultBump: bumpSeed,
      flags: new anchor.BN(AIRDROP_FLAG_VERIFICATION_REQUIRED),
    };

    await RewardsProgram.rpc.airdropCreate(params, {
      accounts: {
        airdrop: airdropKey.publicKey,
        authority: wallet.publicKey,
        rewardVault: airdropVault,
        payer: wallet.publicKey,
        tokenMint: testToken.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      },
      signers: [airdropKey],
      instructions: [
        await RewardsProgram.account.airdrop.createInstruction(airdropKey),
      ],
    });

    await testToken.mintTo(
      airdropVault,
      wallet.payer,
      [],
      new u64(5_000_000_000)
    );
  });

  it("add airdrop recipient", async () => {
    const params = {
      startIndex: new anchor.BN(0),
      recipients: [
        {
          amount: new anchor.BN(4_200_000_000),
          recipient: staker.publicKey,
        },
      ],
    };
    await RewardsProgram.rpc.airdropAddRecipients(params, {
      accounts: {
        airdrop: airdropKey.publicKey,
        authority: wallet.publicKey,
      },
    });
  });

  it("finalize airdrop", async () => {
    await RewardsProgram.rpc.airdropFinalize({
      accounts: {
        airdrop: airdropKey.publicKey,
        rewardVault: airdropVault,
        authority: wallet.publicKey,
      },
    });
  });

  it("user initiates claim", async () => {
    let bumpSeed: number;

    [stakerClaim, bumpSeed] = await PublicKey.findProgramAddress(
      [staker.publicKey.toBuffer(), airdropKey.publicKey.toBuffer()],
      RewardsProgram.programId
    );

    await RewardsProgram.rpc.airdropClaimBegin(bumpSeed, {
      accounts: {
        airdrop: airdropKey.publicKey,
        claim: stakerClaim,
        entitled: staker.publicKey,
        payer: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [staker],
    });
  });

  it("user cannot complete claim without being verified", async () => {
    try {
      await RewardsProgram.rpc.airdropClaimComplete({
        accounts: {
          airdrop: airdropKey.publicKey,
          rewardVault: airdropVault,
          claim: stakerClaim,
          recipient: staker.publicKey,
          receiver: wallet.publicKey,
          stakePool: stakeAcc.stakePool,
          stakePoolVault: stakeAcc.stakePoolVault,
          stakeAccount: stakerAccount,
          stakingProgram: StakingProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
        signers: [staker],
      });
      assert.ok(false);
    } catch (e) {
      assert.equal(e.code, 6006);
    }
  });

  it("verify user claim", async () => {
    await RewardsProgram.rpc.airdropClaimVerify({
      accounts: {
        airdrop: airdropKey.publicKey,
        claim: stakerClaim,
        authority: wallet.publicKey,
      },
    });
  });

  it("user claims airdrop", async () => {
    await RewardsProgram.rpc.airdropClaimComplete({
      accounts: {
        airdrop: airdropKey.publicKey,
        rewardVault: airdropVault,
        claim: stakerClaim,
        recipient: staker.publicKey,
        receiver: wallet.publicKey,
        stakePool: stakeAcc.stakePool,
        stakePoolVault: stakeAcc.stakePoolVault,
        stakeAccount: stakerAccount,
        stakingProgram: StakingProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
      signers: [staker],
    });
  });

  it("user unbonds stake", async () => {
    let bumpSeed: number;
    let unbondSeed = Buffer.alloc(4);

    [stakerUnbond, bumpSeed] = await PublicKey.findProgramAddress(
      [stakerAccount.toBuffer(), unbondSeed],
      StakingProgram.programId
    );

    await StakingProgram.rpc.unbondStake(
      bumpSeed,
      0,
      { kind: { tokens: {} }, value: new u64(4_200_000_000) },
      {
        accounts: {
          owner: staker.publicKey,
          payer: wallet.publicKey,
          stakeAccount: stakerAccount,
          stakePool: stakeAcc.stakePool,
          stakePoolVault: stakeAcc.stakePoolVault,
          unbondingAccount: stakerUnbond,
          systemProgram: SystemProgram.programId,
        },
        signers: [staker],
      }
    );
  });

  it("user withdraws unbonded stake", async () => {
    const testAta = await testToken.getOrCreateAssociatedAccountInfo(
      staker.publicKey
    );

    await StakingProgram.rpc.withdrawUnbondend({
      accounts: {
        owner: staker.publicKey,
        closer: wallet.publicKey,
        tokenReceiver: testAta.address,
        stakeAccount: stakerAccount,
        stakePool: stakeAcc.stakePool,
        stakePoolVault: stakeAcc.stakePoolVault,
        unbondingAccount: stakerUnbond,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
      signers: [staker],
    });

    const updatedAta = await testToken.getOrCreateAssociatedAccountInfo(
      staker.publicKey
    );

    assert.equal(updatedAta.amount.toNumber(), 4_200_000_000);
  });

  it("close ")
});
