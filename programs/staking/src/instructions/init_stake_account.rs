use anchor_lang::prelude::*;

use crate::state::*;

#[derive(AnchorDeserialize, AnchorSerialize)]
pub struct InitStakeAccountSeeds {
    stake_account: u8,
    stake_token_account: u8,
}

#[derive(Accounts)]
#[instruction(bump: InitStakeAccountSeeds)]
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
              bump = bump.stake_account,
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

    Ok(())
}
