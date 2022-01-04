use std::io::Write;

use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};

use crate::state::*;

#[derive(AnchorDeserialize, AnchorSerialize)]
pub struct AirdropCreateParams {
    /// The start of the vesting period for claimed rewards.
    pub vest_start_at: i64,

    /// The end of the vesting period for claimed rewards.
    pub vest_end_at: i64,

    /// The stake pool that claimed rewards are deposited into.
    pub stake_pool: Pubkey,

    /// A description for this airdrop
    pub short_desc: String,

    /// The bump seed needed to generate the airdrop account address
    pub vault_bump: u8,

    /// Airdrop settings
    pub flags: u64,
}

#[derive(Accounts)]
#[instruction(params: AirdropCreateParams)]
pub struct AirdropCreate<'info> {
    /// The account to store all the airdrop metadata
    #[account(zero)]
    pub airdrop: AccountLoader<'info, Airdrop>,

    /// The address that will have authority over the airdrop
    pub authority: UncheckedAccount<'info>,

    /// The account to store the tokens to be distributed
    /// as a reward via the airdrop
    #[account(init,
              seeds = [
                  airdrop.key().as_ref(),
                  b"vault".as_ref()
              ],
              bump = params.vault_bump,
              payer = payer,
              token::mint = token_mint,
              token::authority = reward_vault)]
    pub reward_vault: Account<'info, TokenAccount>,

    /// The payer for rent charges
    #[account(mut)]
    pub payer: Signer<'info>,

    /// The reward token's mint
    pub token_mint: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn airdrop_create_handler(
    ctx: Context<AirdropCreate>,
    params: AirdropCreateParams,
) -> ProgramResult {
    let mut airdrop = ctx.accounts.airdrop.load_init()?;

    airdrop.authority = ctx.accounts.authority.key();
    airdrop.reward_vault = ctx.accounts.reward_vault.key();
    airdrop.vault_bump[0] = params.vault_bump;

    airdrop.vest_start_at = params.vest_start_at;
    airdrop.vest_end_at = params.vest_end_at;
    airdrop.stake_pool = params.stake_pool;

    airdrop.flags = params.flags;

    airdrop
        .short_desc
        .as_mut()
        .write(params.short_desc.as_bytes())?;

    Ok(())
}
