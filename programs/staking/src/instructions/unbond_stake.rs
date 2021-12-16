use anchor_lang::prelude::*;
use anchor_spl::token;

use crate::state::*;

#[derive(Accounts)]
#[instruction(bump: u8, seed: u32)]
pub struct UnbondStake<'info> {
    /// The owner of the stake account
    pub owner: Signer<'info>,

    /// The payer for rent
    pub payer: Signer<'info>,

    /// The account owning the stake to be unbonded
    #[account(mut,
              has_one = owner,
              has_one = stake_pool)]
    pub stake_account: Account<'info, StakeAccount>,

    /// The stake pool to be unbonded from
    #[account(mut, has_one = stake_pool_vault)]
    pub stake_pool: Account<'info, StakePool>,

    /// The stake pool token vault
    pub stake_pool_vault: AccountInfo<'info>,

    /// The account to record this unbonding request
    #[account(init,
              seeds = [
                  stake_account.key().as_ref(),
                  seed.to_le_bytes().as_ref()
              ],
              bump = bump,
              payer = payer)]
    pub unbonding_account: Account<'info, UnbondingAccount>,

    pub system_program: Program<'info, System>,
}

pub fn unbond_stake_handler(
    ctx: Context<UnbondStake>,
    _bump: u8,
    _seed: u32,
    share_amount: u64,
) -> ProgramResult {
    let stake_pool = &mut ctx.accounts.stake_pool;
    let stake_account = &mut ctx.accounts.stake_account;
    let unbonding_account = &mut ctx.accounts.unbonding_account;
    let clock = Clock::get()?;

    let vault_amount = token::accessor::amount(&ctx.accounts.stake_pool_vault)?;
    let token_amount = stake_pool.unbond(vault_amount, share_amount);

    stake_account.unbond(share_amount)?;

    unbonding_account.stake_account = stake_account.key();
    unbonding_account.amount = share_amount;
    unbonding_account.token_amount = token_amount;
    unbonding_account.unbonded_at = clock.unix_timestamp + stake_pool.unbond_period;

    Ok(())
}
