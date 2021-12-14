use anchor_lang::prelude::*;
use anchor_lang::solana_program::clock::SECONDS_PER_DAY;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

mod instructions;
mod state;

use anchor_spl::token::{self};
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

pub struct ExchangeCalc<'a, 'info> {
    stake_pool_vault: &'a AccountInfo<'info>,
    stake_pool: &'a state::StakePool,
}

impl<'a, 'info> ExchangeCalc<'a, 'info> {
    pub fn to_stake_tokens(&self, amount: u64) -> Result<u64, ProgramError> {
        let (vault_holdings, mint_supply) = self.read_state()?;
        let stake_tokens = (mint_supply * amount as u128) / vault_holdings;

        assert!(stake_tokens < std::u64::MAX as u128);

        Ok(stake_tokens as u64)
    }

    pub fn from_stake_tokens(&self, amount: u64) -> Result<u64, ProgramError> {
        let (vault_holdings, mint_supply) = self.read_state()?;
        let tokens = (vault_holdings * amount as u128) / mint_supply;

        assert!(tokens < std::u64::MAX as u128);

        Ok(tokens as u64)
    }

    pub fn new(stake_pool_vault: &'a AccountInfo<'info>, stake_pool: &'a state::StakePool) -> Self {
        Self {
            stake_pool_vault,
            stake_pool,
        }
    }

    fn read_state(&self) -> Result<(u128, u128), ProgramError> {
        let vault_holdings = token::accessor::amount(self.stake_pool_vault)? as u128;

        Ok((vault_holdings, self.stake_pool.share_supply as u128))
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
