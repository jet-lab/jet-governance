use anchor_lang::prelude::*;
use anchor_spl::token::TokenAccount;

use crate::state::*;
use crate::events::CancelUnbondEvent;

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
    #[account(mut, has_one = stake_pool_vault)]
    pub stake_pool: Account<'info, StakePool>,

    /// The stake pool token vault
    pub stake_pool_vault: Account<'info, TokenAccount>,

    /// The account to record this unbonding request
    #[account(mut,
              close = receiver,
              has_one = stake_account)]
    pub unbonding_account: Account<'info, UnbondingAccount>,
}

pub fn cancel_unbond_handler(ctx: Context<CancelUnbond>) -> ProgramResult {
    let stake_pool = &mut ctx.accounts.stake_pool;
    let stake_account = &mut ctx.accounts.stake_account;
    let unbonding_account = &mut ctx.accounts.unbonding_account;

    stake_pool.update_vault(ctx.accounts.stake_pool_vault.amount);
    stake_pool.rebond(stake_account, unbonding_account);

    emit!( CancelUnbondEvent {
        owner: ctx.accounts.owner.key(),
        stake_pool: stake_pool.key(),
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
