import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import {
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  TransactionInstruction
} from "@solana/web3.js";
import { Token, TOKEN_PROGRAM_ID, u64 } from "@solana/spl-token";
import {
  withCreateRealm,
  MintMaxVoteWeightSource,
  getTokenHoldingAddress,
  getTokenOwnerRecordAddress
} from "@solana/spl-governance";
import { JetRewards } from "../target/types/jet_rewards";
import { JetStaking } from "../target/types/jet_staking";
import { JetAuth } from "../target/types/jet_auth";
import { assert } from "chai";

const GOVERNANCE_ID = new PublicKey("JPGovTiAUgyqirerBbXXmfyt3SkHVEcpSAPjRCCSHVx");
const RewardsProgram = anchor.workspace.JetRewards as Program<JetRewards>;
const StakingProgram = anchor.workspace.JetStaking as Program<JetStaking>;
const AuthProgram = anchor.workspace.JetAuth as Program<JetAuth>;

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

async function deriveStakePoolAccounts(seed: string): Promise<StakePoolAccounts> {
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
  let [stakeCollateralMint, stakeCollateralMintBump] = await PublicKey.findProgramAddress(
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
      stakePoolVault: stakePoolVaultBump
    }
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
  const airdropRecipients = Array.from({ length: 60 })
    .map(_ => Keypair.generate())
    .sort((a, b) => a.publicKey.toBuffer().compare(b.publicKey.toBuffer()));

  let testToken: Token;
  let voteToken: Token;
  let stakeAcc: StakePoolAccounts;

  let stakerAccount: PublicKey;
  let stakerAuth: PublicKey;
  let stakerClaim: PublicKey;
  let stakerUnbond: PublicKey;
  let airdropVault: PublicKey;

  let stakerUnbondBump: number;

  let distAccount: PublicKey;
  let distVault: PublicKey;
  let awardAccount: PublicKey;
  let awardVault: PublicKey;
  let govRealm: PublicKey;
  let govVault: PublicKey;
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

    stakeAcc = await deriveStakePoolAccounts(stakeSeed);
  });

  it("create pool", async () => {
    const config = { unbondPeriod: new u64(0) };

    await StakingProgram.rpc.initPool(stakeSeed, config, {
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
        rent: SYSVAR_RENT_PUBKEY
      }
    });

    voteToken = new Token(
      provider.connection,
      stakeAcc.stakeVoteMint,
      TOKEN_PROGRAM_ID,
      wallet.payer
    );
  });

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

    await StakingProgram.rpc.initStakeAccount({
      accounts: {
        owner: staker.publicKey,
        auth: stakerAuth,
        stakePool: stakeAcc.stakePool,
        stakeAccount: stakerAccount,
        payer: wallet.publicKey,
        systemProgram: SystemProgram.programId
      },
      signers: [staker]
    });
  });

  it("create airdrop", async () => {
    let bumpSeed: number;

    [airdropVault, bumpSeed] = await PublicKey.findProgramAddress(
      [airdropKey.publicKey.toBuffer(), Buffer.from("vault")],
      RewardsProgram.programId
    );

    const params = {
      expireAt: new anchor.BN(Date.now() / 1000 + 10),
      stakePool: stakeAcc.stakePool,
      shortDesc: "integ-test-airdrop",
      longDesc: "integ-test-airdrop description",
      flags: new anchor.BN(0)
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
        rent: SYSVAR_RENT_PUBKEY
      },
      signers: [airdropKey],
      instructions: [await RewardsProgram.account.airdrop.createInstruction(airdropKey)]
    });

    await testToken.mintTo(airdropVault, wallet.publicKey, [], new u64(5_000_000_000));
  });

  it("add airdrop recipient", async () => {
    const params = {
      startIndex: new anchor.BN(0),
      recipients: [
        {
          amount: new anchor.BN(4_200_000_000),
          recipient: staker.publicKey
        }
      ]
    };
    await RewardsProgram.rpc.airdropAddRecipients(params, {
      accounts: {
        airdrop: airdropKey.publicKey,
        authority: wallet.publicKey
      }
    });
  });

  it("user cannot claim from non-final airdrop", async () => {
    try {
      await RewardsProgram.rpc.airdropClaim({
        accounts: {
          airdrop: airdropKey.publicKey,
          rewardVault: airdropVault,
          recipient: staker.publicKey,
          receiver: wallet.publicKey,
          stakePool: stakeAcc.stakePool,
          stakePoolVault: stakeAcc.stakePoolVault,
          stakeAccount: stakerAccount,
          stakingProgram: StakingProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID
        },
        signers: [staker]
      });

      assert.ok(false);
    } catch (e) {
      assert.equal(e.code, 6005);
    }
  });

  it("finalize airdrop", async () => {
    await RewardsProgram.rpc.airdropFinalize({
      accounts: {
        airdrop: airdropKey.publicKey,
        rewardVault: airdropVault,
        authority: wallet.publicKey
      }
    });
  });

  it("user claims airdrop", async () => {
    await RewardsProgram.rpc.airdropClaim({
      accounts: {
        airdrop: airdropKey.publicKey,
        rewardVault: airdropVault,
        recipient: staker.publicKey,
        receiver: wallet.publicKey,
        stakePool: stakeAcc.stakePool,
        stakePoolVault: stakeAcc.stakePoolVault,
        stakeAccount: stakerAccount,
        stakingProgram: StakingProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID
      },
      signers: [staker]
    });
  });

  it("user unbonds stake", async () => {
    let unbondSeed = Buffer.alloc(4);

    [stakerUnbond, stakerUnbondBump] = await PublicKey.findProgramAddress(
      [stakerAccount.toBuffer(), unbondSeed],
      StakingProgram.programId
    );

    await StakingProgram.rpc.unbondStake(0, new u64(4_199_999_999), {
      accounts: {
        owner: staker.publicKey,
        payer: wallet.publicKey,
        stakeAccount: stakerAccount,
        stakePool: stakeAcc.stakePool,
        stakePoolVault: stakeAcc.stakePoolVault,
        unbondingAccount: stakerUnbond,
        systemProgram: SystemProgram.programId
      },
      signers: [staker]
    });
  });

  it("user cancels unbonding", async () => {
    await StakingProgram.rpc.cancelUnbond({
      accounts: {
        owner: staker.publicKey,
        stakeAccount: stakerAccount,
        stakePool: stakeAcc.stakePool,
        stakePoolVault: stakeAcc.stakePoolVault,
        unbondingAccount: stakerUnbond,
        receiver: wallet.publicKey
      },
      signers: [staker]
    });
  });

  it("user unbonds again", async () => {
    await StakingProgram.rpc.unbondStake(0, new u64(4_199_999_999), {
      accounts: {
        owner: staker.publicKey,
        payer: wallet.publicKey,
        stakeAccount: stakerAccount,
        stakePool: stakeAcc.stakePool,
        stakePoolVault: stakeAcc.stakePoolVault,
        unbondingAccount: stakerUnbond,
        systemProgram: SystemProgram.programId
      },
      signers: [staker]
    });
  });

  it("user withdraws unbonded stake", async () => {
    const testAta = await testToken.getOrCreateAssociatedAccountInfo(staker.publicKey);

    await StakingProgram.rpc.withdrawUnbonded({
      accounts: {
        owner: staker.publicKey,
        closer: wallet.publicKey,
        tokenReceiver: testAta.address,
        stakeAccount: stakerAccount,
        stakePool: stakeAcc.stakePool,
        stakePoolVault: stakeAcc.stakePoolVault,
        unbondingAccount: stakerUnbond,
        tokenProgram: TOKEN_PROGRAM_ID
      },
      signers: [staker]
    });

    const updatedAta = await testToken.getOrCreateAssociatedAccountInfo(staker.publicKey);

    assert.equal(updatedAta.amount.toNumber(), 4_199_999_999);
  });

  it("close airdrop", async () => {
    await new Promise(resolve => setTimeout(resolve, 8_000));
    const walletAta = await testToken.getOrCreateAssociatedAccountInfo(wallet.publicKey);

    await RewardsProgram.rpc.airdropClose({
      accounts: {
        airdrop: airdropKey.publicKey,
        rewardVault: airdropVault,
        authority: wallet.publicKey,
        receiver: wallet.publicKey,
        tokenReceiver: walletAta.address,
        tokenProgram: TOKEN_PROGRAM_ID
      }
    });

    const updatedAta = await testToken.getOrCreateAssociatedAccountInfo(wallet.publicKey);

    assert.equal(updatedAta.amount.toNumber(), 800_000_000);
  });

  it("user restakes", async () => {
    const testAta = await testToken.getOrCreateAssociatedAccountInfo(staker.publicKey);

    await StakingProgram.rpc.addStake(new u64(4_199_999_999), {
      accounts: {
        stakeAccount: stakerAccount,
        stakePool: stakeAcc.stakePool,
        stakePoolVault: stakeAcc.stakePoolVault,
        payer: staker.publicKey,
        payerTokenAccount: testAta.address,
        tokenProgram: TOKEN_PROGRAM_ID
      },
      signers: [staker]
    });

    const updatedAta = await testToken.getOrCreateAssociatedAccountInfo(staker.publicKey);

    assert.equal(updatedAta.amount.toNumber(), 0);
  });

  it("create reward distribution", async () => {
    let bumpSeed: number;
    let vaultBumpSeed: number;
    let distSeed = "foo";

    [distAccount, bumpSeed] = await PublicKey.findProgramAddress(
      [Buffer.from("distribution"), Buffer.from(distSeed)],
      RewardsProgram.programId
    );

    [distVault, vaultBumpSeed] = await PublicKey.findProgramAddress(
      [distAccount.toBuffer(), Buffer.from("vault")],
      RewardsProgram.programId
    );

    const fundingAta = await testToken.getOrCreateAssociatedAccountInfo(wallet.publicKey);
    await testToken.mintTo(fundingAta.address, wallet.publicKey, [], 4_200_000_000);

    await RewardsProgram.rpc.distributionCreate(
      {
        amount: new u64(5_000_000_000),
        authority: wallet.publicKey,
        seed: distSeed,
        targetAccount: stakeAcc.stakePoolVault,
        beginAt: new u64(0),
        endAt: new u64(0)
      },
      {
        accounts: {
          distribution: distAccount,
          vault: distVault,
          payerRent: wallet.publicKey,
          payerTokenAuthority: wallet.publicKey,
          payerTokenAccount: fundingAta.address,
          tokenMint: testToken.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY
        }
      }
    );
  });

  it("distribute reward", async () => {
    await RewardsProgram.rpc.distributionRelease({
      accounts: {
        distribution: distAccount,
        vault: distVault,
        targetAccount: stakeAcc.stakePoolVault,
        tokenProgram: TOKEN_PROGRAM_ID
      }
    });
  });

  it("create award", async () => {
    let bumpSeed: number;
    let vaultBumpSeed: number;
    let distSeed = "foo-award";

    [awardAccount, bumpSeed] = await PublicKey.findProgramAddress(
      [Buffer.from("award"), stakerAccount.toBuffer(), Buffer.from(distSeed)],
      RewardsProgram.programId
    );

    [awardVault, vaultBumpSeed] = await PublicKey.findProgramAddress(
      [awardAccount.toBuffer(), Buffer.from("vault")],
      RewardsProgram.programId
    );

    const fundingAta = await testToken.getOrCreateAssociatedAccountInfo(wallet.publicKey);
    await testToken.mintTo(fundingAta.address, wallet.publicKey, [], 800_000_000);

    await RewardsProgram.rpc.awardCreate(
      {
        amount: new u64(800_000_000),
        authority: wallet.publicKey,
        seed: distSeed,
        stakeAccount: stakerAccount,
        beginAt: new u64(0),
        endAt: new u64(0)
      },
      {
        accounts: {
          award: awardAccount,
          vault: awardVault,
          payerRent: wallet.publicKey,
          tokenSourceAuthority: wallet.publicKey,
          tokenSource: fundingAta.address,
          tokenMint: testToken.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY
        }
      }
    );
  });

  it("distribute award", async () => {
    await RewardsProgram.rpc.awardRelease({
      accounts: {
        award: awardAccount,
        vault: awardVault,
        stakeAccount: stakerAccount,
        stakePool: stakeAcc.stakePool,
        stakePoolVault: stakeAcc.stakePoolVault,
        stakingProgram: StakingProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID
      }
    });

    await RewardsProgram.rpc.awardClose({
      accounts: {
        award: awardAccount,
        vault: awardVault,
        authority: wallet.publicKey,
        receiver: wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID
      }
    });
  });

  it("create award to revoke", async () => {
    let bumpSeed: number;
    let vaultBumpSeed: number;
    let distSeed = "revoke-award";

    [awardAccount, bumpSeed] = await PublicKey.findProgramAddress(
      [Buffer.from("award"), stakerAccount.toBuffer(), Buffer.from(distSeed)],
      RewardsProgram.programId
    );

    [awardVault, vaultBumpSeed] = await PublicKey.findProgramAddress(
      [awardAccount.toBuffer(), Buffer.from("vault")],
      RewardsProgram.programId
    );

    const fundingAta = await testToken.getOrCreateAssociatedAccountInfo(wallet.publicKey);
    await testToken.mintTo(fundingAta.address, wallet.publicKey, [], 800_000_000);

    await RewardsProgram.rpc.awardCreate(
      {
        amount: new u64(800_000_000),
        authority: wallet.publicKey,
        seed: distSeed,
        stakeAccount: stakerAccount,
        beginAt: new u64(0),
        endAt: new u64(0)
      },
      {
        accounts: {
          award: awardAccount,
          vault: awardVault,
          payerRent: wallet.publicKey,
          tokenSourceAuthority: wallet.publicKey,
          tokenSource: fundingAta.address,
          tokenMint: testToken.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY
        }
      }
    );
  });

  it("revoke award", async () => {
    const fundingAta = await testToken.getOrCreateAssociatedAccountInfo(wallet.publicKey);

    await RewardsProgram.rpc.awardRevoke({
      accounts: {
        award: awardAccount,
        vault: awardVault,
        authority: wallet.publicKey,
        receiver: wallet.publicKey,
        tokenReceiver: fundingAta.address,
        tokenProgram: TOKEN_PROGRAM_ID
      }
    });

    const updatedAta = await testToken.getOrCreateAssociatedAccountInfo(wallet.publicKey);

    assert.equal(updatedAta.amount.toNumber(), 800_000_000);
  });

  it("create governance realm", async () => {
    let instructions: TransactionInstruction[] = [];

    govRealm = await withCreateRealm(
      instructions,
      GOVERNANCE_ID,
      2,
      "localtest",
      wallet.payer.publicKey,
      stakeAcc.stakeVoteMint,
      wallet.payer.publicKey,
      undefined,
      new MintMaxVoteWeightSource({ value: MintMaxVoteWeightSource.SUPPLY_FRACTION_BASE }),
      new anchor.BN(1),
      undefined,
      undefined
    );

    govVault = await getTokenHoldingAddress(GOVERNANCE_ID, govRealm, stakeAcc.stakeVoteMint);
    stakerGovRecord = await getTokenOwnerRecordAddress(
      GOVERNANCE_ID,
      govRealm,
      stakeAcc.stakeVoteMint,
      staker.publicKey
    );

    await sendAndConfirmTransaction(provider.connection, new Transaction().add(...instructions), [
      wallet.payer
    ]);
  });

  it("mint zero votes", async () => {
    const voteAta = await voteToken.getOrCreateAssociatedAccountInfo(staker.publicKey);

    await StakingProgram.rpc.mintVotes(new u64(0), {
      accounts: {
        owner: staker.publicKey,
        stakePool: stakeAcc.stakePool,
        stakePoolVault: stakeAcc.stakePoolVault,
        stakeVoteMint: stakeAcc.stakeVoteMint,
        stakeAccount: stakerAccount,
        voterTokenAccount: voteAta.address,
        governanceRealm: govRealm,
        governanceVault: govVault,
        governanceOwnerRecord: stakerGovRecord,
        payer: wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        governanceProgram: GOVERNANCE_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY
      },
      signers: [staker]
    });
  });

  it("mint max votes", async () => {
    const voteAta = await voteToken.getOrCreateAssociatedAccountInfo(staker.publicKey);

    await StakingProgram.rpc.mintVotes(null, {
      accounts: {
        owner: staker.publicKey,
        stakePool: stakeAcc.stakePool,
        stakePoolVault: stakeAcc.stakePoolVault,
        stakeVoteMint: stakeAcc.stakeVoteMint,
        stakeAccount: stakerAccount,
        voterTokenAccount: voteAta.address,
        governanceRealm: govRealm,
        governanceVault: govVault,
        governanceOwnerRecord: stakerGovRecord,
        payer: wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        governanceProgram: GOVERNANCE_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY
      },
      signers: [staker]
    });

    const updatedVault = await voteToken.getAccountInfo(govVault);

    assert.equal(updatedVault.amount.toNumber(), 10_000_000_000);
  });

  it("user cannot mint extra votes", async () => {
    try {
      const voteAta = await voteToken.getOrCreateAssociatedAccountInfo(staker.publicKey);

      await StakingProgram.rpc.mintVotes(new u64(1_000), {
        accounts: {
          owner: staker.publicKey,
          stakePool: stakeAcc.stakePool,
          stakePoolVault: stakeAcc.stakePoolVault,
          stakeVoteMint: stakeAcc.stakeVoteMint,
          stakeAccount: stakerAccount,
          voterTokenAccount: voteAta.address,
          governanceRealm: govRealm,
          governanceVault: govVault,
          governanceOwnerRecord: stakerGovRecord,
          payer: wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          governanceProgram: GOVERNANCE_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY
        },
        signers: [staker]
      });
      assert.ok(false);
    } catch (e) {
      assert.equal(e.code, 6000);
    }
  });

  it("user cannot unbond with outstanding votes", async () => {
    try {
      let bumpSeed: number;
      let unbondSeed = Buffer.alloc(4);

      [stakerUnbond, bumpSeed] = await PublicKey.findProgramAddress(
        [stakerAccount.toBuffer(), unbondSeed],
        StakingProgram.programId
      );

      await StakingProgram.rpc.unbondStake(0, new u64(4_200_000_000), {
        accounts: {
          owner: staker.publicKey,
          payer: wallet.publicKey,
          stakeAccount: stakerAccount,
          stakePool: stakeAcc.stakePool,
          stakePoolVault: stakeAcc.stakePoolVault,
          unbondingAccount: stakerUnbond,
          systemProgram: SystemProgram.programId
        },
        signers: [staker]
      });

      assert.ok(false);
    } catch (e) {
      assert.equal(e.code, 6001);
    }
  });

  it("create mass airdrop", async () => {
    let bumpSeed: number;

    [airdropVault, bumpSeed] = await PublicKey.findProgramAddress(
      [airdropKey.publicKey.toBuffer(), Buffer.from("vault")],
      RewardsProgram.programId
    );

    const params = {
      expireAt: new anchor.BN(Date.now() / 1000 + 1000),
      stakePool: stakeAcc.stakePool,
      shortDesc: "integ-test-airdrop",
      longDesc: "some airdrop testing",
      vaultBump: bumpSeed,
      flags: new anchor.BN(0)
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
        rent: SYSVAR_RENT_PUBKEY
      },
      signers: [airdropKey],
      instructions: [await RewardsProgram.account.airdrop.createInstruction(airdropKey)]
    });

    await testToken.mintTo(airdropVault, wallet.payer, [], new u64(600_000_000));

    const chunkSize = 24;
    const chunks = Math.floor(airdropRecipients.length / chunkSize);

    for (let i = 0; i < airdropRecipients.length; i += chunkSize) {
      let chunk = airdropRecipients.slice(i, i + chunkSize);

      const addParams = {
        startIndex: new anchor.BN(i),
        recipients: chunk.map(k => {
          return {
            amount: new anchor.BN(10_000_000),
            recipient: k.publicKey
          };
        })
      };

      await RewardsProgram.rpc.airdropAddRecipients(addParams, {
        accounts: {
          airdrop: airdropKey.publicKey,
          authority: wallet.publicKey
        }
      });
    }

    await RewardsProgram.rpc.airdropFinalize({
      accounts: {
        airdrop: airdropKey.publicKey,
        rewardVault: airdropVault,
        authority: wallet.publicKey
      }
    });
  });

  it("recipients claim from mass airdrop", async () => {
    await Promise.all(
      airdropRecipients.map(recipient =>
        (async () => {
          let [recipientAuth, authBumpSeed] = await PublicKey.findProgramAddress(
            [recipient.publicKey.toBuffer()],
            AuthProgram.programId
          );

          await AuthProgram.rpc.createUserAuth({
            accounts: {
              user: recipient.publicKey,
              payer: wallet.publicKey,
              auth: recipientAuth,
              systemProgram: SystemProgram.programId
            },
            signers: [recipient]
          });

          await AuthProgram.rpc.authenticate({
            accounts: {
              authority: wallet.publicKey,
              auth: recipientAuth
            }
          });

          let [recipientStakeAccount, stakeBumpSeed] = await PublicKey.findProgramAddress(
            [stakeAcc.stakePool.toBuffer(), recipient.publicKey.toBuffer()],
            StakingProgram.programId
          );

          await StakingProgram.rpc.initStakeAccount({
            accounts: {
              owner: recipient.publicKey,
              auth: recipientAuth,
              stakePool: stakeAcc.stakePool,
              stakeAccount: recipientStakeAccount,
              payer: wallet.publicKey,
              systemProgram: SystemProgram.programId
            },
            signers: [recipient]
          });

          await RewardsProgram.rpc.airdropClaim({
            accounts: {
              airdrop: airdropKey.publicKey,
              rewardVault: airdropVault,
              recipient: recipient.publicKey,
              receiver: wallet.publicKey,
              stakePool: stakeAcc.stakePool,
              stakePoolVault: stakeAcc.stakePoolVault,
              stakeAccount: recipientStakeAccount,
              stakingProgram: StakingProgram.programId,
              tokenProgram: TOKEN_PROGRAM_ID
            },
            signers: [recipient]
          });
        })()
      )
    );

    assert.equal(0, (await testToken.getAccountInfo(airdropVault)).amount.toNumber());
  });
});
