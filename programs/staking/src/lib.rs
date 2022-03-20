use anchor_lang::prelude::*;
use anchor_lang::solana_program::pubkey;

declare_id!("JPLockxtkngHkaQT5AuRYow3HyUv5qWzmhwsCPd653n");

mod instructions;
pub mod state;

use instructions::*;

#[program]
pub mod jet_staking {
    use super::*;

    /// Initialize a new pool that tokens can be staked to
    ///
    /// # Params
    ///
    /// * `seed` - A string to derive the pool address
    pub fn init_pool(ctx: Context<InitPool>, seed: String, config: PoolConfig) -> ProgramResult {
        instructions::init_pool_handler(ctx, seed, config)
    }

    /// Initialize a new staking account
    ///
    /// The account created is tied to the owner that signed to create it.
    ///
    pub fn init_stake_account(ctx: Context<InitStakeAccount>) -> ProgramResult {
        instructions::init_stake_account_handler(ctx)
    }

    /// Add tokens as stake to an account
    ///
    /// # Params
    ///
    /// * `amount` - The amount of tokens to transfer to the stake pool
    pub fn add_stake(ctx: Context<AddStake>, amount: Option<u64>) -> ProgramResult {
        instructions::add_stake_handler(ctx, amount)
    }

    /// Unbond stake from an account, allowing it to be withdrawn
    pub fn unbond_stake(
        ctx: Context<UnbondStake>,
        seed: u32,
        amount: Option<u64>,
    ) -> ProgramResult {
        instructions::unbond_stake_handler(ctx, seed, amount)
    }

    /// Cancel a previous request to unbond stake
    pub fn cancel_unbond(ctx: Context<CancelUnbond>) -> ProgramResult {
        instructions::cancel_unbond_handler(ctx)
    }

    /// Withdraw stake that was previously unbonded
    pub fn withdraw_unbonded(ctx: Context<WithdrawUnbonded>) -> ProgramResult {
        instructions::withdraw_unbonded_handler(ctx)
    }

    /// Withdraw stake from the pool by the authority
    pub fn withdraw_bonded(ctx: Context<WithdrawBonded>, amount: u64) -> ProgramResult {
        instructions::withdraw_bonded_handler(ctx, amount)
    }

    /// Mint voting tokens based on current stake
    pub fn mint_votes(ctx: Context<MintVotes>, amount: Option<u64>) -> ProgramResult {
        instructions::mint_votes_handler(ctx, amount)
    }

    /// Burn outstanding burning tokens to unlock stake
    pub fn burn_votes(ctx: Context<BurnVotes>, amount: Option<u64>) -> ProgramResult {
        instructions::burn_votes_handler(ctx, amount)
    }

    /// Close out the stake account, return any rent
    pub fn close_stake_account(ctx: Context<CloseStakeAccount>) -> ProgramResult {
        instructions::close_stake_account_handler(ctx)
    }
}

pub use error::ErrorCode;

mod error {
    use super::*;

    #[error]
    #[derive(Eq, PartialEq)]
    pub enum ErrorCode {
        InsufficientStake,
        VotesLocked,
        CollateralLocked,
        NotYetUnbonded,
        StakeRemaining,
        InvalidAmount,
    }
}

#[derive(Copy, Clone)]
pub struct SplGovernance;

impl Id for SplGovernance {
    fn id() -> Pubkey {
        pubkey!("JPGovTiAUgyqirerBbXXmfyt3SkHVEcpSAPjRCCSHVx")
    }
}
