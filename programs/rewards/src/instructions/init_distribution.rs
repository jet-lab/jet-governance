use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::state::*;

#[derive(AnchorDeserialize, AnchorSerialize)]
pub struct InitDistributionParams {
    /// The authority allowed to manage the distribution
    pub authority: Pubkey,

    /// The token account to send the distributed tokens to
    pub target_account: Pubkey,

    /// The amount of tokens to be distributed
    pub amount: u64,

    /// Time distribution starts at
    pub begin_at: u64,

    /// Time distribution is completed at
    pub end_at: u64,

    /// Bump seed for the vault account
    pub vault_bump: u8,
}

#[derive(Accounts)]
#[instruction(params: InitDistributionParams)]
pub struct InitDistribution<'info> {
    /// The account to store the distribution info
    #[account(zero)]
    pub distribution: Account<'info, Distribution>,

    /// The account to store the tokens to be distributed
    #[account(init,
              seeds = [
                  distribution.key().as_ref(),
                  b"vault".as_ref()
              ],
              bump = params.vault_bump,
              payer = payer_rent,
              token::mint = token_mint,
              token::authority = vault)]
    pub vault: Account<'info, TokenAccount>,

    /// The payer for rent charges
    #[account(mut)]
    pub payer_rent: Signer<'info>,

    /// The payer providing the tokens to be distributed
    pub payer_token_authority: Signer<'info>,

    /// The account to source the tokens to be distributed
    #[account(mut)]
    pub payer_token_account: UncheckedAccount<'info>,

    /// The distribution token's mint
    pub token_mint: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> InitDistribution<'info> {
    fn transfer_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.payer_token_account.to_account_info(),
                to: self.vault.to_account_info(),
                authority: self.payer_token_authority.to_account_info(),
            },
        )
    }
}

pub fn init_distribution_handler(
    ctx: Context<InitDistribution>,
    params: InitDistributionParams,
) -> ProgramResult {
    let distribution = &mut ctx.accounts.distribution;

    distribution.address = distribution.key();
    distribution.authority = params.authority;
    distribution.vault = ctx.accounts.vault.key();
    distribution.vault_bump[0] = params.vault_bump;
    distribution.target_account = params.target_account;
    distribution.target_amount = params.amount;
    distribution.begin_at = params.begin_at;
    distribution.end_at = params.end_at;
    distribution.kind = DistributionKind::Linear;

    token::transfer(ctx.accounts.transfer_context(), params.amount)?;

    Ok(())
}