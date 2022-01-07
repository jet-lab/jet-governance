use anchor_lang::prelude::*;
use anchor_spl::token::Token;

use crate::state::*;
use jet_staking::cpi::accounts::AddStake;
use jet_staking::program::JetStaking;

#[derive(Accounts)]
pub struct AwardRelease<'info> {
    /// The account storing the award info
    #[account(mut,
              has_one = vault,
              has_one = stake_account)]
    pub award: Account<'info, Award>,

    /// The account storing the tokens to be distributed
    #[account(mut)]
    pub vault: AccountInfo<'info>,

    /// The account to transfer the distributed tokens to
    #[account(mut)]
    pub stake_account: UncheckedAccount<'info>,

    /// The stake pool the account is part of
    #[account(mut)]
    pub stake_pool: UncheckedAccount<'info>,

    /// The token vault for the pool
    #[account(mut)]
    pub stake_pool_vault: UncheckedAccount<'info>,

    pub staking_program: Program<'info, JetStaking>,
    pub token_program: Program<'info, Token>,
}

impl<'info> AwardRelease<'info> {
    fn add_stake_context(&self) -> CpiContext<'_, '_, '_, 'info, AddStake<'info>> {
        CpiContext::new(
            self.staking_program.to_account_info(),
            AddStake {
                stake_pool: self.stake_pool.to_account_info(),
                stake_pool_vault: self.stake_pool_vault.to_account_info(),
                stake_account: self.stake_account.to_account_info(),
                payer: self.award.to_account_info(),
                payer_token_account: self.vault.to_account_info(),
                token_program: self.token_program.to_account_info(),
            },
        )
    }
}

pub fn award_release_handler(ctx: Context<AwardRelease>) -> ProgramResult {
    let award = &mut ctx.accounts.award;
    let clock = Clock::get()?;

    let to_distribute = award.distribute(clock.unix_timestamp as u64);
    let award = &ctx.accounts.award;

    jet_staking::cpi::add_stake(
        ctx.accounts
            .add_stake_context()
            .with_signer(&[&award.signer_seeds()]),
        jet_staking::Amount::tokens(to_distribute),
    )?;

    Ok(())
}