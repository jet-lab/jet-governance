use anchor_lang::prelude::*;

use crate::state::*;

#[derive(Accounts)]
pub struct CloseStakeAccount<'info> {
    /// The owner of the stake account
    pub owner: Signer<'info>,

    /// The receiver for the rent recovered
    /// CHECK:
    #[account(mut)]
    pub closer: UncheckedAccount<'info>,

    /// The account owning the stake to be unlocked
    #[account(mut,
              close = closer,
              has_one = owner)]
    pub stake_account: Account<'info, StakeAccount>,
}

pub fn close_stake_account_handler(ctx: Context<CloseStakeAccount>) -> Result<()> {
    let stake_account = &ctx.accounts.stake_account;

    assert!(stake_account.bonded_shares == 0);
    assert!(stake_account.minted_votes == 0);
    assert!(stake_account.minted_collateral == 0);
    assert!(stake_account.unbonding_shares == 0);

    Ok(())
}
