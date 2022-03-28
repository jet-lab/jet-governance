use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::state::*;
use crate::events::AddStakeEvent;

#[derive(Accounts)]
pub struct AddStake<'info> {
    /// The stake pool to deposit stake into
    #[account(mut, has_one = stake_pool_vault)]
    pub stake_pool: Account<'info, StakePool>,

    /// The stake pool token vault
    #[account(mut)]
    pub stake_pool_vault: Account<'info, TokenAccount>,

    /// The account to own the stake being deposited
    #[account(mut, has_one = stake_pool)]
    pub stake_account: Account<'info, StakeAccount>,

    /// The depositor of the stake
    pub payer: Signer<'info>,

    /// The depositor's token account to taken the deposit from
    #[account(mut)]
    pub payer_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

impl<'info> AddStake<'info> {
    fn transfer_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.payer_token_account.to_account_info(),
                to: self.stake_pool_vault.to_account_info(),
                authority: self.payer.to_account_info(),
            },
        )
    }
}

/// handler handler
pub fn add_stake_handler(ctx: Context<AddStake>, amount: Option<u64>) -> ProgramResult {
    let stake_pool = &mut ctx.accounts.stake_pool;
    let stake_account = &mut ctx.accounts.stake_account;
    

    stake_pool.update_vault(ctx.accounts.stake_pool_vault.amount);

    let token_amount = match amount {
        Some(n) => n,
        None => ctx.accounts.payer_token_account.amount,
    };

    let full_amount = stake_pool.deposit(stake_account, token_amount);
    token::transfer(ctx.accounts.transfer_context(), full_amount.token_amount)?;
    
    // emit!(AddStakeEvent {
    //     stake_pool: stake_pool.key(),
    //     payer: ctx.accounts.payer.key(),
    //     amount: token_amount,
    //     bonded_pool_tokens: stake_pool.shares_bonded,
    //     unbonding_pool_tokens: stake_pool.tokens_unbonding,
    //     vault_pool_amount: stake_pool.vault_amount, 
    //     bonded_owner_shares: stake_account.shares,
    //     minted_owner_votes: stake_account.minted_votes, 
    //     minted_owner_collateral: stake_account.minted_collateral,
    //     unbonding_owner_shares: stake_account.unbonding
    // });
    
    Ok(())
}
