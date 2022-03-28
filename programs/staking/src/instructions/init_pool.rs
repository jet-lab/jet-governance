use std::io::Write;

use anchor_lang::prelude::*;
use anchor_spl::token::TokenAccount;
use anchor_spl::token::{Mint, Token};

use crate::state::*;
use crate::events::InitPoolEvent;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct PoolConfig {
    /// The time period for unbonding staked tokens from the pool.
    ///
    /// Unit is seconds.
    unbond_period: u64,
}

#[derive(Accounts)]
#[instruction(seed: String)]
pub struct InitPool<'info> {
    /// The address paying to create this pool
    #[account(mut)]
    pub payer: Signer<'info>,

    /// The address allowed to sign for changes to the pool,
    /// and management of the token balance.
    /// CHECK:
    pub authority: UncheckedAccount<'info>,

    /// The mint for the tokens being staked into the pool.
    pub token_mint: Account<'info, Mint>,

    /// The new pool being created
    #[account(
        init,
        payer = payer,
        seeds = [seed.as_bytes()],
        bump,
        space = 8 + std::mem::size_of::<StakePool>(),
    )]
    pub stake_pool: Box<Account<'info, StakePool>>,

    /// The mint to issue derived voting tokens
    #[account(init,
              seeds = [
                  seed.as_bytes(),
                  b"vote-mint".as_ref()
              ],
              bump,
              payer = payer,
              mint::decimals = token_mint.decimals,
              mint::authority = stake_pool)]
    pub stake_vote_mint: Account<'info, Mint>,

    /// The mint to issue derived collateral tokens
    #[account(init,
              seeds = [
                  seed.as_bytes(),
                  b"collateral-mint".as_ref()
              ],
              bump,
              payer = payer,
              mint::decimals = token_mint.decimals,
              mint::authority = stake_pool)]
    pub stake_collateral_mint: Account<'info, Mint>,

    /// The token account that stores the tokens staked into the pool.
    #[account(init,
              seeds = [
                  seed.as_bytes(),
                  b"vault".as_ref()
              ],
              bump,
              payer = payer,
              token::mint = token_mint,
              token::authority = stake_pool)]
    pub stake_pool_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn init_pool_handler(ctx: Context<InitPool>, seed: String, config: PoolConfig) -> Result<()> {
    let stake_pool = &mut ctx.accounts.stake_pool;

    stake_pool.authority = ctx.accounts.authority.key();
    stake_pool.token_mint = ctx.accounts.token_mint.key();
    stake_pool.stake_pool_vault = ctx.accounts.stake_pool_vault.key();
    stake_pool.stake_vote_mint = ctx.accounts.stake_vote_mint.key();

    stake_pool.bump_seed[0] = *ctx.bumps.get("stake_pool").unwrap();
    stake_pool.seed.as_mut().write_all(seed.as_bytes())?;
    stake_pool.seed_len = seed.len() as u8;

    stake_pool.unbond_period = config.unbond_period as i64;

    emit!(InitPoolEvent {
        stake_pool: stake_pool.key(),
        unbond_period_config: stake_pool.unbond_period, 
        payer: ctx.accounts.payer.key(),
        authority: ctx.accounts.authority.key(),
        token_mint: stake_pool.token_mint,
        stake_pool_vote_mint: stake_pool.stake_vote_mint,
        stake_pool_collateral_mint: ctx.accounts.stake_collateral_mint.key(),
        stake_pool_vault: stake_pool.stake_pool_vault 
    });

    Ok(())
}
