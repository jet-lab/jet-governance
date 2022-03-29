use anchor_lang::prelude::*;

use crate::{
    state::DistributionKind, AirdropCreateParams, AirdropRecipientParam, AwardCreateParams,
    DistributionCreateParams,
};

// AIRDROPS

#[event]
pub struct AirdropCreated {
    pub airdrop: Pubkey,
    pub authority: Pubkey,
    pub token_mint: Pubkey,
    pub params: AirdropCreateParams,
}

#[event]
pub struct AirdropRecipientsAdded {
    pub airdrop: Pubkey,
    pub reward_additional: u64,
    pub reward_total: u64,
    pub recipients_additional: u64,
    pub recipients_total: u64,
    pub recipients: Vec<AirdropRecipientParam>,
}

#[event]
pub struct AirdropFinalized {
    pub airdrop: Pubkey,
    pub reward_total: u64,
    pub recipients_total: u64,

    pub vault_balance: u64,
}

#[event]
pub struct AirdropClaimed {
    pub airdrop: Pubkey,
    pub recipient: Pubkey,
    pub claimed_amount: u64,
    pub remaining_amount: u64,

    pub vault_balance: u64,
}

#[event]
pub struct AirdropClosed {
    pub airdrop: Pubkey,

    pub vault_balance: u64,
}

// AWARDS

#[event]
pub struct AwardCreated {
    pub award: Pubkey,
    pub token_mint: Pubkey,
    pub params: AwardCreateParams,
    pub distribution_kind: DistributionKind,
}

#[event]
pub struct AwardReleased {
    pub award: Pubkey,

    /// The amount released in this instruction.
    pub amount_released: u64,

    /// The total amount this award intends to release by its end time.
    pub target_amount: u64,

    /// The total amount this award has released so far, including amount_released.
    pub total_distributed: u64,
}

#[event]
pub struct AwardClosed {
    pub award: Pubkey,
}

// DISTRIBUTION

#[event]
pub struct DistributionCreated {
    pub distribution: Pubkey,
    pub token_mint: Pubkey,
    pub params: DistributionCreateParams,
    pub distribution_kind: DistributionKind,
}

#[event]
pub struct DistributionReleased {
    pub distribution: Pubkey,

    /// The amount released in this instruction.
    pub amount_released: u64,

    /// The total amount this distribution intends to release by its end time.
    pub target_amount: u64,

    /// The total amount this distribution has released so far, including amount_released.
    pub total_distributed: u64,
}

#[event]
pub struct DistributionClosed {
    pub distribution: Pubkey,
}
