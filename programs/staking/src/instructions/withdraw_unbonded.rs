use anchor_lang::prelude::*;
use anchor_spl::token;
use anchor_spl::token::Token;
use anchor_spl::token::TokenAccount;
use anchor_spl::token::Transfer;

use crate::state::*;
use crate::ErrorCode;
use crate::events::WithdrawUnbondedEvent;

#[derive(Accounts)]
pub struct WithdrawUnbonded<'info> {
    /// The owner of the stake account
    pub owner: Signer<'info>,

    /// The receiver for the recovered rent
    /// CHECK:
    #[account(mut)]
    pub closer: UncheckedAccount<'info>,

    /// The receiver for the withdrawn tokens
    /// CHECK:
    #[account(mut)]
    pub token_receiver: UncheckedAccount<'info>,

    /// The account owning the stake that is unbonded
    #[account(mut,
              has_one = owner,
              has_one = stake_pool)]
    pub stake_account: Account<'info, StakeAccount>,

    /// The stake pool to withdraw from
    #[account(mut, has_one = stake_pool_vault)]
    pub stake_pool: Account<'info, StakePool>,

    /// The stake pool token vault
    #[account(mut)]
    pub stake_pool_vault: Account<'info, TokenAccount>,

    /// The account that recorded the initial unbonding request
    #[account(mut,
              close = closer,
              has_one = stake_account)]
    pub unbonding_account: Account<'info, UnbondingAccount>,

    pub token_program: Program<'info, Token>,
}

impl<'info> WithdrawUnbonded<'info> {
    fn transfer_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.stake_pool_vault.to_account_info(),
                to: self.token_receiver.to_account_info(),
                authority: self.stake_pool.to_account_info(),
            },
        )
    }
}

pub fn withdraw_unbonded_handler(ctx: Context<WithdrawUnbonded>) -> Result<()> {
    let stake_pool = &mut ctx.accounts.stake_pool;
    let stake_account = &mut ctx.accounts.stake_account;
    let unbonding_account = &mut ctx.accounts.unbonding_account;
    let clock = Clock::get()?;

    if unbonding_account.unbonded_at > clock.unix_timestamp {
        return Err(ErrorCode::NotYetUnbonded.into());
    }

    stake_pool.update_vault(ctx.accounts.stake_pool_vault.amount);
    let unbond_amount = stake_pool.withdraw_unbonded(stake_account, unbonding_account);

    unbonding_account.stake_account = Pubkey::default();
    let stake_pool = &ctx.accounts.stake_pool;

    token::transfer(
        ctx.accounts
            .transfer_context()
            .with_signer(&[&stake_pool.signer_seeds()]),
        unbond_amount.token_amount,
    )?;
    
    // emit!(WithdrawUnbondedEvent {
    //     owner: ctx.accounts.owner.key(),
    //     token_receiver: ctx.accounts.token_receiver.key(),
    //     stake_pool: stake_pool.key(),
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
