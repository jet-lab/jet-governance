use anchor_lang::prelude::*;

use crate::state::*;
use jet_auth::UserAuthentication;
use crate::events::InitStakeAccountEvent;

#[derive(Accounts)]
pub struct InitStakeAccount<'info> {
    /// The owner for the stake
    pub owner: Signer<'info>,

    /// The authentication account, which identifies that the given owner
    /// is actually allowed to use this program.
    #[account(has_one = owner,
              constraint = auth.allowed)]
    pub auth: Account<'info, UserAuthentication>,

    /// The stake pool to create an account with
    pub stake_pool: Account<'info, StakePool>,

    /// The new stake account
    #[account(init,
              seeds = [
                  stake_pool.key().as_ref(),
                  owner.key.as_ref()
              ],
              bump,
              payer = payer)]
    pub stake_account: Account<'info, StakeAccount>,

    /// The address that will pay for the rent
    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn init_stake_account_handler(ctx: Context<InitStakeAccount>) -> ProgramResult {
    let account = &mut ctx.accounts.stake_account;

    account.owner = *ctx.accounts.owner.key;
    account.stake_pool = ctx.accounts.stake_pool.key();
    
    emit!(InitStakeAccountEvent {
        auth: ctx.accounts.auth.key(),
        stake_pool: ctx.accounts.stake_pool.key(),
        owner: ctx.accounts.owner.key(),
        stake_account: ctx.accounts.stake_account.key(),
    });

    Ok(())
}
