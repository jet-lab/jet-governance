use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Token, TokenAccount};

use crate::events::{Note, VotesBurned};
use crate::state::*;

#[derive(Accounts)]
pub struct BurnVotes<'info> {
    /// The owner of the stake account
    pub owner: Signer<'info>,

    /// The stake pool to burn votes from
    #[account(has_one = stake_vote_mint)]
    pub stake_pool: Account<'info, StakePool>,

    /// The stake pool's voter mint
    /// CHECK:
    #[account(mut)]
    pub stake_vote_mint: AccountInfo<'info>,

    /// The account that owns the stake being used for voting
    #[account(mut,
              has_one = owner,
              has_one = stake_pool)]
    pub stake_account: Account<'info, StakeAccount>,

    /// The token account to burn the vote tokens from
    /// CHECK:
    #[account(mut)]
    pub voter_token_account: Box<Account<'info, TokenAccount>>,

    /// The signer for the vote token account
    pub voter: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

impl<'info> BurnVotes<'info> {
    fn burn_context(&self) -> CpiContext<'_, '_, '_, 'info, Burn<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Burn {
                mint: self.stake_vote_mint.to_account_info(),
                to: self.voter_token_account.to_account_info(),
                authority: self.voter.to_account_info(),
            },
        )
    }
}

pub fn burn_votes_handler(ctx: Context<BurnVotes>, amount: Option<u64>) -> Result<()> {
    let stake_pool = &ctx.accounts.stake_pool;
    let stake_account = &mut ctx.accounts.stake_account;

    let burned_amount = match amount {
        Some(n) => n,
        None => token::accessor::amount(&ctx.accounts.voter_token_account.to_account_info())?,
    };
    stake_account.burn_votes(burned_amount);

    token::burn(
        ctx.accounts
            .burn_context()
            .with_signer(&[&stake_pool.signer_seeds()]),
        burned_amount,
    )?;

    let stake_account = &ctx.accounts.stake_account;

    emit!(VotesBurned {
        stake_pool: stake_pool.key(),
        stake_account: stake_account.key(),
        owner: ctx.accounts.owner.key(),

        burned_amount,

        pool_note: stake_pool.note(),
        account_note: stake_account.note(),

        voter_account_balance: ctx.accounts.voter_token_account.amount,
    });

    Ok(())
}
