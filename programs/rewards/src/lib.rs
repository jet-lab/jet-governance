use anchor_lang::prelude::*;

declare_id!("JET777rQuPU8BatFbhp6irc1NAbozxTheBqNo25eLQP");

mod instructions;
mod state;

use instructions::*;

#[program]
pub mod rewards {
    use super::*;

    /// Initialize a new account to manage an airdrop, which can distribute
    /// tokens to a large set of accounts.
    pub fn init_airdrop(ctx: Context<InitAirdrop>, params: InitAirdropParams) -> ProgramResult {
        instructions::init_airdrop_handler(ctx, params)
    }

    /// Add recipients of an airdrop.
    ///
    /// Recipients have to be provided in sorted order based on the
    /// recipient's address.
    pub fn add_airdrop_recipients(
        ctx: Context<AddAirdropRecipients>,
        params: AddAirdropRecipientsParams,
    ) -> ProgramResult {
        instructions::add_airdrop_recipients_handler(ctx, params)
    }

    /// Mark an airdrop account as final, preventing any further changes,
    /// and allowing recipients to claim their tokens.
    pub fn finalize_airdrop(ctx: Context<FinalizeAirdrop>) -> ProgramResult {
        instructions::finalize_airdrop_handler(ctx)
    }

    /// Close and delete an airdrop account.
    pub fn close_airdrop(ctx: Context<CloseAirdrop>) -> ProgramResult {
        instructions::close_airdrop_handler(ctx)
    }

    /// Claim tokens from an airdrop as a recipient
    pub fn claim_airdrop(ctx: Context<ClaimAirdrop>) -> ProgramResult {
        instructions::claim_airdrop_handler(ctx)
    }

    /// Claim tokens from an airdrop, which are deposited as locked stake
    /// with vesting terms configured on the airdrop.
    pub fn claim_airdrop_locked(
        ctx: Context<ClaimAirdropLocked>,
        params: ClaimAirdropLockedParams,
    ) -> ProgramResult {
        instructions::claim_airdrop_locked_handler(ctx, params)
    }

    /// Initialize a new token distribution
    pub fn init_distribution(
        ctx: Context<InitDistribution>,
        params: InitDistributionParams,
    ) -> ProgramResult {
        instructions::init_distribution_handler(ctx, params)
    }

    /// Release tokens from a distrubtion to the target
    pub fn distribution_release(ctx: Context<DistributionRelease>) -> ProgramResult {
        instructions::distribution_release_handler(ctx)
    }
}

#[derive(Accounts)]
pub struct Initialize {}

mod error {
    use super::*;

    #[error]
    pub enum ErrorCode {
        RecipientNotFound,
        AddOutOfOrder,
        AirdropFinal,
        AirdropInsufficientRewardBalance,
        ClaimMustVest,
    }
}

pub use error::ErrorCode;
