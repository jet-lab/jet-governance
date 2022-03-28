use anchor_lang::prelude::*;
use anchor_spl::token::Token;

use jet_staking::cpi::accounts::AddStake;
use jet_staking::program::JetStaking;

use crate::state::*;
use crate::ErrorCode;

#[derive(Accounts)]
pub struct AirdropClaim<'info> {
    /// The airdrop to claim from
    #[account(mut,
              has_one = stake_pool,
              has_one = reward_vault)]
    pub airdrop: AccountLoader<'info, Airdrop>,

    /// The token account to claim the rewarded tokens from
    #[account(mut)]
    pub reward_vault: AccountInfo<'info>,

    /// The address entitled to the airdrop, which must sign to claim
    pub recipient: Signer<'info>,

    /// The address to receive rent recovered from the claim account
    #[account(mut)]
    pub receiver: UncheckedAccount<'info>,

    /// The stake pool to deposit stake into
    #[account(mut)]
    pub stake_pool: AccountInfo<'info>,

    /// The stake pool token vault
    #[account(mut)]
    pub stake_pool_vault: UncheckedAccount<'info>,

    /// The account to own the stake being deposited
    #[account(mut)]
    pub stake_account: AccountInfo<'info>,

    pub staking_program: Program<'info, JetStaking>,
    pub token_program: Program<'info, Token>,
}

impl<'info> AirdropClaim<'info> {
    fn add_stake_context(&self) -> CpiContext<'_, '_, '_, 'info, AddStake<'info>> {
        CpiContext::new(
            self.staking_program.to_account_info(),
            AddStake {
                stake_pool: self.stake_pool.to_account_info(),
                stake_pool_vault: self.stake_pool_vault.to_account_info(),
                stake_account: self.stake_account.to_account_info(),
                payer: self.reward_vault.to_account_info(),
                payer_token_account: self.reward_vault.to_account_info(),
                token_program: self.token_program.to_account_info(),
            },
        )
    }
}

pub fn airdrop_claim_handler(ctx: Context<AirdropClaim>) -> ProgramResult {
    let mut airdrop = ctx.accounts.airdrop.load_mut()?;
    let clock = Clock::get()?;

    if airdrop.expire_at <= clock.unix_timestamp {
        msg!("this airdrop is expired");
        return Err(ErrorCode::AirdropExpired.into());
    }

    let claimed_amount = airdrop.claim(&ctx.accounts.recipient.key())?;

    jet_staking::cpi::add_stake(
        ctx.accounts
            .add_stake_context()
            .with_signer(&[&airdrop.signer_seeds()]),
        Some(claimed_amount),
    )?;

    Ok(())
}
