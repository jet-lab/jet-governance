use anchor_lang::prelude::*;

use crate::state::*;
use crate::ErrorCode;

#[derive(Accounts)]
pub struct CloseVestingAccount<'info> {
    /// The owner of the stake account
    pub owner: Signer<'info>,

    /// The receiver for the rent recovered
    pub closer: UncheckedAccount<'info>,

    /// The account owning the stake to be unlocked
    #[account(mut, has_one = owner)]
    pub stake_account: Account<'info, StakeAccount>,

    /// The vesting account to unlock from
    #[account(mut,
              close = closer,
              has_one = stake_account)]
    pub vesting_account: Account<'info, VestingAccount>,
}

pub fn close_vesting_account_handler(ctx: Context<CloseVestingAccount>) -> ProgramResult {
    let vesting_account = &mut ctx.accounts.vesting_account;

    if vesting_account.unlocked != vesting_account.total {
        return Err(ErrorCode::NotYetVested.into());
    }

    Ok(())
}
