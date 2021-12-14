use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, Transfer};

use crate::state::*;

#[derive(Accounts)]
pub struct AddStake<'info> {
    /// The stake pool to deposit stake into
    #[account(mut, has_one = stake_pool_vault)]
    pub stake_pool: Account<'info, StakePool>,

    /// The stake pool token vault
    pub stake_pool_vault: AccountInfo<'info>,

    /// The account to own the stake being deposited
    #[account(mut, has_one = stake_pool)]
    pub stake_account: Account<'info, StakeAccount>,

    /// The depositor of the stake
    pub payer: Signer<'info>,

    /// The depositor's token account to taken the deposit from
    #[account(mut)]
    pub payer_token_account: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
}

impl<'info> AddStake<'info> {
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

/// handler handler
pub fn add_stake_handler(ctx: Context<AddStake>, amount: u64) -> ProgramResult {
    let stake_pool = &mut ctx.accounts.stake_pool;
    let stake_account = &mut ctx.accounts.stake_account;

    let vault_amount = token::accessor::amount(&ctx.accounts.stake_pool_vault)?;
    let staked_amount = stake_pool.deposit(vault_amount, amount);

    stake_account.deposit_unlocked(staked_amount);

    token::transfer(ctx.accounts.transfer_context(), amount)?;

    Ok(())
}
