use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, Transfer};

use crate::state::*;

#[derive(Accounts)]
#[instruction(bump: u8, seed: u32)]
pub struct AddStakeLocked<'info> {
    /// The stake pool to add stake to
    #[account(mut, has_one = stake_pool_vault)]
    pub stake_pool: Account<'info, StakePool>,

    /// The stake pool token vault
    pub stake_pool_vault: AccountInfo<'info>,

    /// The stake account that the tokens will belong to
    #[account(mut, has_one = stake_pool)]
    pub stake_account: Account<'info, StakeAccount>,

    /// The new vesting account to manage the unlock period
    #[account(init,
              seeds = [
                  stake_account.key().as_ref(),
                  seed.to_le_bytes().as_ref()
              ],
              bump = bump,
              payer = payer)]
    pub vesting_account: Account<'info, VestingAccount>,

    /// The payer for creating the account
    #[account(mut)]
    pub payer: Signer<'info>,

    /// The source of the tokens to be staked for vesting
    #[account(mut)]
    pub payer_token_account: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

impl<'info> AddStakeLocked<'info> {
    fn transfer_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.payer_token_account.to_account_info(),
                to: self.stake_pool_vault.to_account_info(),
                authority: self.payer.to_account_info(),
            },
        )
    }
}

pub fn add_stake_locked_handler(
    ctx: Context<AddStakeLocked>,
    _bump: u8,
    _seed: u32,
    amount: u64,
    start_at: i64,
    end_at: i64,
) -> ProgramResult {
    let stake_pool = &mut ctx.accounts.stake_pool;
    let stake_account = &mut ctx.accounts.stake_account;
    let vesting_account = &mut ctx.accounts.vesting_account;

    let vault_amount = token::accessor::amount(&ctx.accounts.stake_pool_vault)?;
    let staked_amount = stake_pool.deposit(vault_amount, amount);

    vesting_account.stake_account = stake_account.key();
    vesting_account.total = staked_amount;
    vesting_account.unlocked = 0;
    vesting_account.vest_start_at = start_at;
    vesting_account.vest_end_at = end_at;

    stake_account.locked = stake_account.locked.checked_add(staked_amount).unwrap();

    token::transfer(ctx.accounts.transfer_context(), amount)?;

    Ok(())
}
