use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke;
use anchor_spl::token::{self, MintTo, Token, TokenAccount};

use crate::events::{Note, VotesMinted};
use crate::{state::*, SplGovernance};

#[derive(Accounts)]
pub struct MintVotes<'info> {
    /// The owner of the stake account
    pub owner: Signer<'info>,

    /// The stake pool to mint votes from
    #[account(mut,
              has_one = stake_vote_mint,
              has_one = stake_pool_vault)]
    pub stake_pool: Box<Account<'info, StakePool>>,

    /// The stake pool token vault
    pub stake_pool_vault: Box<Account<'info, TokenAccount>>,

    /// The stake pool's voter mint
    /// CHECK:
    #[account(mut)]
    pub stake_vote_mint: AccountInfo<'info>,

    /// The account that owns the stake being used for voting
    #[account(mut,
              has_one = owner,
              has_one = stake_pool)]
    pub stake_account: Box<Account<'info, StakeAccount>>,

    /// A temporary token account for storing vote tokens
    /// CHECK:
    #[account(mut)]
    pub voter_token_account: Box<Account<'info, TokenAccount>>,

    /// The governance realm to deposit votes into
    /// CHECK:
    pub governance_realm: UncheckedAccount<'info>,

    /// The account holding governance tokens deposited into the realm
    /// CHECK:
    #[account(mut)]
    pub governance_vault: UncheckedAccount<'info>,

    /// The Token Owner Record for the owner of this account
    /// CHECK:
    #[account(mut)]
    pub governance_owner_record: UncheckedAccount<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub governance_program: Program<'info, SplGovernance>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
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

    fn deposit_gov_tokens(&self, amount: u64) -> Result<()> {
        let ix = spl_governance::instruction::deposit_governing_tokens(
            &SplGovernance::id(),
            self.governance_realm.key,
            &self.voter_token_account.key(),
            self.owner.key,
            self.owner.key,
            self.payer.key,
            amount,
            self.stake_vote_mint.key,
        );

        invoke(
            &ix,
            &[
                self.governance_realm.to_account_info(),
                self.governance_vault.to_account_info(),
                self.voter_token_account.to_account_info(),
                self.owner.to_account_info(),
                self.owner.to_account_info(),
                self.governance_owner_record.to_account_info(),
                self.payer.to_account_info(),
                self.system_program.to_account_info(),
                self.token_program.to_account_info(),
                self.rent.to_account_info(),
                self.governance_program.to_account_info(),
            ],
        )
        .map_err(Into::into)
    }
}

pub fn mint_votes_handler(ctx: Context<MintVotes>, amount: Option<u64>) -> Result<()> {
    let stake_pool = &mut ctx.accounts.stake_pool;
    let stake_account = &mut ctx.accounts.stake_account;

    stake_pool.update_vault(ctx.accounts.stake_pool_vault.amount);
    let minted_amount = stake_account.mint_votes(amount)?;
    let stake_pool = &ctx.accounts.stake_pool;

    token::mint_to(
        ctx.accounts
            .mint_context()
            .with_signer(&[&stake_pool.signer_seeds()]),
        minted_amount,
    )?;

    ctx.accounts.deposit_gov_tokens(minted_amount)?;
    let stake_account = &ctx.accounts.stake_account;

    emit!(VotesMinted {
        stake_pool: stake_pool.key(),
        stake_account: stake_account.key(),
        owner: ctx.accounts.owner.key(),

        minted_amount,

        pool_note: stake_pool.note(),
        account_note: stake_account.note(),

        governance_realm: ctx.accounts.governance_realm.key(),
        voter_account_balance: ctx.accounts.voter_token_account.amount,
    });

    Ok(())
}
