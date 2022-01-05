use anchor_lang::prelude::*;

use crate::state::*;

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct InitStakeAccount<'info> {
    /// The owner for the stake
    pub owner: Signer<'info>,

    /// The stake pool to create an account with
    pub stake_pool: Account<'info, StakePool>,

    /// The new stake account
    #[account(init,
              seeds = [
                  stake_pool.key().as_ref(),
                  owner.key.as_ref()
              ],
              bump = bump,
              payer = payer)]
    pub stake_account: Account<'info, StakeAccount>,

    /// The address that will pay for the rent
    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn init_stake_account_handler(ctx: Context<InitStakeAccount>, _bump: u8) -> ProgramResult {
    let account = &mut ctx.accounts.stake_account;

    account.owner = *ctx.accounts.owner.key;
    account.stake_pool = ctx.accounts.stake_pool.key();

    Ok(())
}
