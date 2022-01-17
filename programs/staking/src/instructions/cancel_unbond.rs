use anchor_lang::prelude::*;

use crate::state::*;

#[derive(Accounts)]
pub struct CancelUnbond<'info> {
    /// The owner of the stake account
    pub owner: Signer<'info>,

    /// The rent receiver
    pub receiver: AccountInfo<'info>,

    /// The account owning the stake to be rebonded
    #[account(mut,
              has_one = owner,
              has_one = stake_pool)]
    pub stake_account: Account<'info, StakeAccount>,

    /// The stake pool to be rebonded to
    #[account(mut)]
    pub stake_pool: Account<'info, StakePool>,

    /// The account to record this unbonding request
    #[account(mut,
              close = receiver,
              has_one = stake_account)]
    pub unbonding_account: Account<'info, UnbondingAccount>,

    pub system_program: Program<'info, System>,
}

pub fn cancel_unbond_handler(ctx: Context<CancelUnbond>) -> ProgramResult {
    let stake_pool = &mut ctx.accounts.stake_pool;
    let stake_account = &mut ctx.accounts.stake_account;
    let unbonding_account = &mut ctx.accounts.unbonding_account;

    stake_pool.rebond(&unbonding_account.amount);
    stake_account.rebond(&unbonding_account.amount);

    Ok(())
}
