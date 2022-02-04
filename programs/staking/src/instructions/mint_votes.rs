use anchor_lang::prelude::*;
use anchor_spl::token::{self, MintTo, Token};

use crate::{state::*, Amount};

#[derive(Accounts)]
pub struct MintVotes<'info> {
    /// The owner of the stake account
    pub owner: Signer<'info>,

    /// The stake pool to mint votes from
    #[account(has_one = stake_vote_mint)]
    pub stake_pool: Account<'info, StakePool>,

    /// The stake pool token vault
    pub stake_pool_vault: AccountInfo<'info>,

    /// The stake pool's voter mint
    #[account(mut)]
    pub stake_vote_mint: AccountInfo<'info>,

    /// The account that owns the stake being used for voting
    #[account(mut,
              has_one = owner,
              has_one = stake_pool)]
    pub stake_account: Account<'info, StakeAccount>,

    /// The token account to deposit the vote tokens into
    #[account(mut)]
    pub voter_token_account: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
}

impl<'info> MintVotes<'info> {
    fn mint_context(&self) -> CpiContext<'_, '_, '_, 'info, MintTo<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            MintTo {
                mint: self.stake_vote_mint.to_account_info(),
                to: self.voter_token_account.to_account_info(),
                authority: self.stake_pool.to_account_info(),
            },
        )
    }
}

pub fn mint_votes_handler(ctx: Context<MintVotes>, amount: Amount) -> ProgramResult {
    let stake_pool = &ctx.accounts.stake_pool;
    let stake_account = &mut ctx.accounts.stake_account;

    let vault_amount = token::accessor::amount(&ctx.accounts.stake_pool_vault)?;
    let full_amount = stake_pool.convert_amount(vault_amount, amount)?;

    stake_account.mint_votes(&full_amount)?;

    token::mint_to(
        ctx.accounts
            .mint_context()
            .with_signer(&[&stake_pool.signer_seeds()]),
        full_amount.tokens,
    )?;

    Ok(())
}
