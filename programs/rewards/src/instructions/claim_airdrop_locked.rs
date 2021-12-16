use anchor_lang::prelude::*;
use anchor_spl::token::Token;

use jet_staking::cpi::accounts::AddStakeLocked;
use jet_staking::program::JetStaking;

use crate::state::*;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct ClaimAirdropLockedParams {
    pub bump: u8,
    pub seed: u32,
}

#[derive(Accounts)]
pub struct ClaimAirdropLocked<'info> {
    /// The airdrop to claim from
    #[account(mut,
              has_one = stake_pool,
              has_one = reward_vault)]
    pub airdrop: AccountLoader<'info, Airdrop>,

    /// The token account to claim the rewarded tokens from
    pub reward_vault: AccountInfo<'info>,

    /// The address entitled to the airdrop, which must sign to claim
    pub entitled: Signer<'info>,

    /// The address paying rent costs
    pub payer: Signer<'info>,

    /// The stake pool to deposit stake into
    #[account(mut)]
    pub stake_pool: AccountInfo<'info>,

    /// The stake pool token vault
    pub stake_pool_vault: AccountInfo<'info>,

    /// The account to own the stake being deposited
    #[account(mut)]
    pub stake_account: AccountInfo<'info>,

    /// The new vesting account
    pub vesting_account: UncheckedAccount<'info>,

    pub staking_program: Program<'info, JetStaking>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

impl<'info> ClaimAirdropLocked<'info> {
    fn add_stake_context(&self) -> CpiContext<'_, '_, '_, 'info, AddStakeLocked<'info>> {
        CpiContext::new(
            self.staking_program.to_account_info(),
            AddStakeLocked {
                stake_pool: self.stake_pool.to_account_info(),
                stake_pool_vault: self.stake_pool_vault.to_account_info(),
                stake_account: self.stake_account.to_account_info(),
                vesting_account: self.vesting_account.to_account_info(),
                payer: self.payer.to_account_info(),
                payer_token_account: self.reward_vault.to_account_info(),
                token_program: self.token_program.to_account_info(),
                system_program: self.system_program.to_account_info(),
            },
        )
    }
}

pub fn claim_airdrop_locked_handler(
    ctx: Context<ClaimAirdropLocked>,
    params: ClaimAirdropLockedParams,
) -> ProgramResult {
    let mut airdrop = ctx.accounts.airdrop.load_mut()?;

    let claimed_amount = airdrop.claim(ctx.accounts.entitled.key)?;

    jet_staking::cpi::add_stake_locked(
        ctx.accounts
            .add_stake_context()
            .with_signer(&[&airdrop.signer_seeds()]),
        params.bump,
        params.seed,
        claimed_amount,
        airdrop.vest_start_at,
        airdrop.vest_end_at,
    )?;

    Ok(())
}
