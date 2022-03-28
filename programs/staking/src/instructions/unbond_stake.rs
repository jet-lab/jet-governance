use anchor_lang::prelude::*;
use anchor_spl::token::TokenAccount;

use crate::state::*;
use crate::events::UnbondStakeEvent;

#[derive(Accounts)]
#[instruction(seed: u32)]
pub struct UnbondStake<'info> {
    /// The owner of the stake account
    pub owner: Signer<'info>,

    /// The payer for rent
    #[account(mut)]
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
    pub stake_pool_vault: Account<'info, TokenAccount>,

    /// The account to record this unbonding request
    #[account(
        init,
        payer = payer,
        seeds = [
            stake_account.key().as_ref(),
            seed.to_le_bytes().as_ref()
        ],
        bump,
        space = 8 + std::mem::size_of::<UnbondingAccount>(),
    )]
    pub unbonding_account: Account<'info, UnbondingAccount>,

    pub system_program: Program<'info, System>,
}

pub fn unbond_stake_handler(
    ctx: Context<UnbondStake>,
    _seed: u32,
    amount: Option<u64>,
) -> Result<()> {
    let stake_pool = &mut ctx.accounts.stake_pool;
    let stake_account = &mut ctx.accounts.stake_account;
    let unbonding_account = &mut ctx.accounts.unbonding_account;
    let clock = Clock::get()?;

    unbonding_account.stake_account = stake_account.key();
    unbonding_account.unbonded_at = clock.unix_timestamp + stake_pool.unbond_period;

    stake_pool.update_vault(ctx.accounts.stake_pool_vault.amount);
    stake_pool.unbond(stake_account, unbonding_account, amount)?;
   
    emit!(UnbondStakeEvent { 
            owner: ctx.accounts.owner.key(),
            stake_pool: stake_pool.key(),
            amount_unbonded: amount,
            bonded_pool_tokens: stake_pool.shares_bonded,
            unbonding_pool_tokens: stake_pool.tokens_unbonding,
            vault_pool_amount: stake_pool.vault_amount, 
            bonded_owner_shares: stake_account.shares,
            minted_owner_votes: stake_account.minted_votes, 
            minted_owner_collateral: stake_account.minted_collateral,
            unbonding_owner_shares: stake_account.unbonding
    });
    
    Ok(())
}
