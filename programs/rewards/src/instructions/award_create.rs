use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::state::*;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct AwardCreateParams {
    /// The seed to create the award address
    pub seed: String,

    /// Bump seed for the address
    pub bump_seed: u8,

    /// The authority allowed to manage the award
    pub authority: Pubkey,

    /// The address receiving the awarded tokens
    pub stake_account: Pubkey,

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
#[instruction(params: AwardCreateParams)]
pub struct AwardCreate<'info> {
    /// The award being created
    #[account(init,
              seeds = [
                  params.stake_account.as_ref(),
                  params.seed.as_bytes(),
              ],
              bump = params.bump_seed,
              payer = payer_rent
    )]
    pub award: Account<'info, Award>,

    /// The account to store the tokens being awarded
    #[account(init,
              seeds = [
                  award.key().as_ref(),
                  b"vault".as_ref()
              ],
              bump = params.vault_bump,
              payer = payer_rent,
              token::mint = token_mint,
              token::authority = award
    )]
    pub vault: Account<'info, TokenAccount>,

    /// The address of the mint for the token being awarded
    pub token_mint: UncheckedAccount<'info>,

    /// The source account for the tokens to be awarded
    #[account(mut)]
    pub token_source: UncheckedAccount<'info>,

    /// The authority for the source tokens
    pub token_source_authority: Signer<'info>,

    /// The address paying rent charges
    #[account(mut)]
    pub payer_rent: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> AwardCreate<'info> {
    fn transfer_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                to: self.vault.to_account_info(),
                from: self.token_source.to_account_info(),
                authority: self.token_source_authority.to_account_info(),
            },
        )
    }
}

pub fn award_create_handler(ctx: Context<AwardCreate>, params: AwardCreateParams) -> ProgramResult {
    let award = &mut ctx.accounts.award;

    award.authority = params.authority;
    award.seed = params.seed;
    award.bump_seed[0] = params.bump_seed;

    award.stake_account = params.stake_account;
    award.vault = ctx.accounts.vault.key();

    award.target_amount = params.amount;
    award.distributed = 0;
    award.begin_at = params.begin_at;
    award.end_at = params.end_at;
    award.kind = DistributionKind::Linear;

    token::transfer(ctx.accounts.transfer_context(), params.amount)?;

    Ok(())
}
