use anchor_lang::prelude::*;
use anchor_lang::solana_program::clock::SECONDS_PER_DAY;

declare_id!("JPLockxtkngHkaQT5AuRYow3HyUv5qWzmhwsCPd653n");

mod instructions;
mod state;

use instructions::*;

pub const DEFAULT_UNBOND_PERIOD: u64 = 30 * SECONDS_PER_DAY;

#[program]
pub mod jet_staking {
    use super::*;

    /// Initialize a new pool that tokens can be staked to
    ///
    /// # Params
    ///
    /// * `seed` - A string to derive the pool address
    /// * `bump` - The bump seeds needed to derive the pool address and
    ///            the supporting accounts.
    pub fn init_pool(ctx: Context<InitPool>, seed: String, bump: InitPoolSeeds) -> ProgramResult {
        instructions::init_pool_handler(ctx, seed, bump)
    }

    /// Initialize a new staking account
    ///
    /// The account created is tied to the owner that signed to create it.
    ///
    /// # Params
    ///
    /// * `bump` - The bump seed needed to derive the account address
    pub fn init_stake_account(ctx: Context<InitStakeAccount>, bump: u8) -> ProgramResult {
        instructions::init_stake_account_handler(ctx, bump)
    }

    /// Add tokens as stake to an account
    ///
    /// # Params
    ///
    /// * `amount` - The amount of tokens to transfer to the stake pool
    pub fn add_stake(ctx: Context<AddStake>, amount: u64) -> ProgramResult {
        instructions::add_stake_handler(ctx, amount)
    }

    /// Add tokens as stake to an account, with a vesting period
    pub fn add_stake_locked(
        ctx: Context<AddStakeLocked>,
        bump: u8,
        seed: u32,
        amount: u64,
        start_at: i64,
        end_at: i64,
    ) -> ProgramResult {
        instructions::add_stake_locked_handler(ctx, bump, seed, amount, start_at, end_at)
    }

    pub fn unbond_stake(
        ctx: Context<UnbondStake>,
        bump: u8,
        seed: u32,
        amount: u64,
    ) -> ProgramResult {
        instructions::unbond_stake_handler(ctx, bump, seed, amount)
    }

    pub fn withdraw_unbondend(ctx: Context<WithdrawUnbonded>) -> ProgramResult {
        instructions::withdraw_unbonded_handler(ctx)
    }

    pub fn unlock_stake(ctx: Context<UnlockStake>) -> ProgramResult {
        instructions::unlock_stake_handler(ctx)
    }

    pub fn mint_votes(ctx: Context<MintVotes>, amount: u64) -> ProgramResult {
        instructions::mint_votes_handler(ctx, amount)
    }

    pub fn burn_votes(ctx: Context<BurnVotes>, amount: u64) -> ProgramResult {
        instructions::burn_votes_handler(ctx, amount)
    }

    pub fn close_vesting_account(ctx: Context<CloseVestingAccount>) -> ProgramResult {
        instructions::close_vesting_account_handler(ctx)
    }

    pub fn close_stake_account(ctx: Context<CloseStakeAccount>) -> ProgramResult {
        instructions::close_stake_account_handler(ctx)
    }
}

pub use error::ErrorCode;

mod error {
    use super::*;

    #[error]
    pub enum ErrorCode {
        InsufficientUnlocked,
        VotesLocked,
        CollateralLocked,

        NotYetUnbonded,
        NotYetVested,

        StakeRemaining,
    }
}
