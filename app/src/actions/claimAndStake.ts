import { Airdrop, AssociatedToken, StakeAccount, StakePool } from "@jet-lab/jet-engine";
import { Program, Provider } from "@project-serum/anchor";
import { ProgramAccount, Realm, RpcContext } from "@solana/spl-governance";
import { sendTransactionWithNotifications } from "../tools/transactions";
import { Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { RewardsIdl } from "@jet-lab/jet-engine/lib/rewards";

export const claimAndStake = async (
  { connection, wallet }: RpcContext,
  rewardsProgram: Program<RewardsIdl>,
  airdrop: Airdrop,
  stakePool: StakePool,
  stakeAccount: StakeAccount,
  owner: PublicKey,
  realm: ProgramAccount<Realm>,
  explorerUrlMaker: Function
) => {
  let instructions: TransactionInstruction[] = [];
  let signers: Keypair[] = [];

  const provider = new Provider(connection, wallet as any, Provider.defaultOptions());
  const voteMint = stakePool.addresses.stakeVoteMint;

  const voterTokenAccount = await AssociatedToken.withCreate(
    instructions,
    provider,
    owner,
    voteMint
  );

  await Airdrop.withClaim(instructions, rewardsProgram, airdrop, stakePool, stakeAccount);
  await StakeAccount.withMintVotes(instructions, stakePool, realm, owner, voterTokenAccount);

  await AssociatedToken.withClose(instructions, owner, voteMint, owner);

  await sendTransactionWithNotifications(
    connection,
    wallet,
    instructions,
    signers,
    "JET claimed and staked",
    explorerUrlMaker
  );
};
