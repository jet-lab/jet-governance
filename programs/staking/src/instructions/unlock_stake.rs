use anchor_lang::prelude::*;

use crate::state::*;

#[derive(Accounts)]
pub struct UnlockStake<'info> {
    /// The owner of the stake account
    pub owner: Signer<'info>,

    /// The account owning the stake to be unlocked
    #[account(mut, has_one = owner)]
    pub stake_account: Account<'info, StakeAccount>,

    /// The vesting account to unlock from
    #[account(mut, has_one = stake_account)]
    pub vesting_account: Account<'info, VestingAccount>,
}

pub fn unlock_stake_handler(ctx: Context<UnlockStake>) -> ProgramResult {
    let stake_account = &mut ctx.accounts.stake_account;
    let vesting_account = &mut ctx.accounts.vesting_account;
    let clock = Clock::get()?;

    let unlockable = vesting_account.unlockable(clock.unix_timestamp);
    let to_unlock = unlockable.checked_sub(vesting_account.unlocked).unwrap();

    if unlockable > 0 {
        stake_account.unlock(to_unlock);
        vesting_account.unlocked = unlockable;
    }

    Ok(())
}
