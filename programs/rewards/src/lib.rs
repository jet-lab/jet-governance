use anchor_lang::prelude::*;

declare_id!("JET777rQuPU8BatFbhp6irc1NAbozxTheBqNo25eLQP");

mod instructions;
mod state;

use instructions::*;

#[program]
pub mod jet_rewards {
    use super::*;

    /// Initialize a new account to manage an airdrop, which can distribute
    /// tokens to a large set of accounts.
    pub fn airdrop_create(
        ctx: Context<AirdropCreate>,
        params: AirdropCreateParams,
    ) -> ProgramResult {
        instructions::airdrop_create_handler(ctx, params)
    }

    /// Add recipients of an airdrop.
    ///
    /// Recipients have to be provided in sorted order based on the
    /// recipient's address.
    pub fn airdrop_add_recipients(
        ctx: Context<AirdropAddRecipients>,
        params: AirdropAddRecipientsParams,
    ) -> ProgramResult {
        instructions::airdrop_add_recipients_handler(ctx, params)
    }

    /// Mark an airdrop account as final, preventing any further changes,
    /// and allowing recipients to claim their tokens.
    pub fn airdrop_finalize(ctx: Context<AirdropFinalize>) -> ProgramResult {
        instructions::airdrop_finalize_handler(ctx)
    }

    /// Close and delete an airdrop account.
    pub fn airdrop_close(ctx: Context<AirdropClose>) -> ProgramResult {
        instructions::airdrop_close_handler(ctx)
    }

    /// Initiate a request to claim tokens from an airdrop
    pub fn airdrop_claim_begin(ctx: Context<AirdropClaimBegin>, bump: u8) -> ProgramResult {
        instructions::airdrop_claim_begin_handler(ctx, bump)
    }

    /// Complete claim of tokens from an airdrop as a recipient
    pub fn airdrop_claim_complete(ctx: Context<AirdropClaimComplete>) -> ProgramResult {
        instructions::airdrop_claim_complete_handler(ctx)
    }

    /// Verify a claim request is allowable
    pub fn airdrop_claim_verify(ctx: Context<AirdropClaimVerify>) -> ProgramResult {
        instructions::airdrop_claim_verify_handler(ctx)
    }

    /// Initialize a new token distribution
    pub fn distribution_create(
        ctx: Context<DistributionCreate>,
        params: DistributionCreateParams,
    ) -> ProgramResult {
        instructions::distribution_create_handler(ctx, params)
    }

    /// Release tokens from a distrubtion to the target
    pub fn distribution_release(ctx: Context<DistributionRelease>) -> ProgramResult {
        instructions::distribution_release_handler(ctx)
    }

    /// Close a completed distribution
    pub fn distribution_close(ctx: Context<DistributionClose>) -> ProgramResult {
        instructions::distribution_close_handler(ctx)
    }

    /// Create a new award, to vest tokens to a stake account over time
    pub fn award_create(ctx: Context<AwardCreate>, params: AwardCreateParams) -> ProgramResult {
        instructions::award_create_handler(ctx, params)
    }

    /// Release vested tokens into the target stake account
    pub fn award_release(ctx: Context<AwardRelease>) -> ProgramResult {
        instructions::award_release_handler(ctx)
    }

    /// Close a fully vested award
    pub fn award_close(ctx: Context<AwardClose>) -> ProgramResult {
        instructions::award_close_handler(ctx)
    }

    /// Revoke an active award, reclaiming the unvested balance
    pub fn award_revoke(ctx: Context<AwardRevoke>) -> ProgramResult {
        instructions::award_revoke_handler(ctx)
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
        AirdropExpired,
        ClaimMustVest,
        ClaimNotVerified,

        DistributionNotEnded,

        AwardNotFullyVested,
    }
}

pub use error::ErrorCode;
