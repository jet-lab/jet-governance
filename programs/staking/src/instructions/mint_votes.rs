use anchor_lang::prelude::*;
use anchor_spl::token::{self, MintTo, Token, TokenAccount};
use solana_program::program::invoke;

use crate::{state::*, SplGovernance};
use crate::events::MintVotesEvent;

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
    #[account(mut)]
    pub stake_vote_mint: AccountInfo<'info>,

    /// The account that owns the stake being used for voting
    #[account(mut,
              has_one = owner,
              has_one = stake_pool)]
    pub stake_account: Box<Account<'info, StakeAccount>>,

    /// A temporary token account for storing vote tokens
    #[account(mut)]
    pub voter_token_account: AccountInfo<'info>,

    /// The governance realm to deposit votes into
    pub governance_realm: UncheckedAccount<'info>,

    /// The account holding governance tokens deposited into the realm
    #[account(mut)]
    pub governance_vault: UncheckedAccount<'info>,

    /// The Token Owner Record for the owner of this account
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

    fn deposit_gov_tokens(&self, amount: u64) -> ProgramResult {
        let ix = spl_governance::instruction::deposit_governing_tokens(
            &SplGovernance::id(),
            self.governance_realm.key,
            self.voter_token_account.key,
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
    }
}

pub fn mint_votes_handler(ctx: Context<MintVotes>, amount: Option<u64>) -> ProgramResult {
    let stake_pool = &mut ctx.accounts.stake_pool;
    let stake_account = &mut ctx.accounts.stake_account;

    stake_pool.update_vault(ctx.accounts.stake_pool_vault.amount);
    let mint_amount = stake_pool.mint_votes(stake_account, amount)?;
    let stake_pool = &ctx.accounts.stake_pool;

    token::mint_to(
        ctx.accounts
            .mint_context()
            .with_signer(&[&stake_pool.signer_seeds()]),
        mint_amount,
    )?;

    ctx.accounts.deposit_gov_tokens(mint_amount)?;
    
    emit!(MintVotesEvent {
        owner: ctx.accounts.owner.key(),
        stake_pool: stake_pool.key(), 
        governance_realm: ctx.accounts.governance_realm.key(), 
        governance_vault: ctx.accounts.governance_vault.key(),
        votes_minted: mint_amount, 
    });

    Ok(())
}
